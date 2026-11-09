import hashlib
import json
import os
import re
import sys
from datetime import datetime, time, timedelta
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

LONDON = ZoneInfo("Europe/London")
REMINDER_WINDOW = timedelta(minutes=30)
REMINDERS = (4, 2)


def parse_event_time(value):
    if not value:
        return None

    match = re.fullmatch(
        r"\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*",
        str(value),
        flags=re.IGNORECASE,
    )
    if not match:
        return None

    hour = int(match.group(1))
    minute = int(match.group(2) or 0)
    meridiem = (match.group(3) or "").lower()

    if minute > 59:
        return None
    if meridiem:
        if hour < 1 or hour > 12:
            return None
        hour = hour % 12 + (12 if meridiem == "pm" else 0)
    elif hour > 23:
        return None

    return time(hour, minute)


def due_event_reminders(events, now):
    now = now.astimezone(LONDON)
    due = []
    for event in events:
        if event.get("notify") is False:
            continue

        event_time = parse_event_time(event.get("time"))
        if event_time is None or not event.get("date"):
            continue

        try:
            event_date = datetime.strptime(event["date"], "%Y-%m-%d").date()
        except ValueError:
            continue

        starts_at = datetime.combine(event_date, event_time, tzinfo=LONDON)
        allowed_reminders = (4,) if event.get("notify") == "4hr" else REMINDERS
        for hours_before in allowed_reminders:
            reminder_at = starts_at - timedelta(hours=hours_before)
            if reminder_at <= now < reminder_at + REMINDER_WINDOW:
                due.append((event, hours_before))
    return due


def request_supabase(method, path, *, api_key, payload=None, prefer=None):
    headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(path, data=body, headers=headers, method=method)
    with urlopen(request, timeout=30) as response:
        response_body = response.read()
        return json.loads(response_body) if response_body else None


def supabase_url(base_url, resource, query=None):
    path = f"{base_url.rstrip('/')}/rest/v1/{resource}"
    return f"{path}?{urlencode(query)}" if query else path


def load_subscriptions(base_url, service_key):
    return request_supabase(
        "GET",
        supabase_url(base_url, "push_subscriptions", {"select": "endpoint,subscription"}),
        api_key=service_key,
    )


def claim_reminder(base_url, service_key, reminder_key):
    url = supabase_url(base_url, "push_reminder_deliveries")
    try:
        request_supabase(
            "POST",
            url,
            api_key=service_key,
            payload={"reminder_key": reminder_key},
            prefer="return=minimal",
        )
        return True
    except HTTPError as error:
        if error.code == 409:
            return False
        raise


def release_reminder_claim(base_url, service_key, reminder_key):
    request_supabase(
        "DELETE",
        supabase_url(
            base_url,
            "push_reminder_deliveries",
            {"reminder_key": f"eq.{reminder_key}"},
        ),
        api_key=service_key,
    )


def remove_subscription(base_url, service_key, endpoint):
    request_supabase(
        "DELETE",
        supabase_url(
            base_url,
            "push_subscriptions",
            {"endpoint": f"eq.{endpoint}"},
        ),
        api_key=service_key,
    )


def subscription_data(value):
    return json.loads(value) if isinstance(value, str) else value


def reminder_key(event, hours_before):
    identity = json.dumps(
        {
            "date": event.get("date"),
            "time": event.get("time"),
            "title": event.get("title"),
            "hours_before": hours_before,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


def send_reminder(event, hours_before, subscriptions, base_url, service_key, private_key, admin_email):
    key = reminder_key(event, hours_before)
    if not claim_reminder(base_url, service_key, key):
        print(f"Already sent {hours_before}-hour reminder: {event.get('title', 'Event')}")
        return

    try:
        from pywebpush import WebPushException, webpush

        title = event.get("title") or "Goldenacre BC Event"
        team = f"({event['team']}) " if event.get("team") else ""
        description = event.get("description") or ""
        payload = json.dumps(
            {
                "title": f"{title} — {hours_before} hours to go",
                "body": f"{team}{hours_before} hours until {event.get('time', 'the event')}. {description}".strip(),
                "url": "/events.html",
            }
        )
        failures = []
        for row in subscriptions:
            try:
                webpush(
                    subscription_info=subscription_data(row["subscription"]),
                    data=payload,
                    vapid_private_key=private_key,
                    vapid_claims={"sub": admin_email},
                    ttl=3600,
                )
            except WebPushException as error:
                response = getattr(error, "response", None)
                status_code = getattr(response, "status_code", None)
                if status_code in (404, 410):
                    remove_subscription(base_url, service_key, row["endpoint"])
                    print(f"Removed expired push subscription (HTTP {status_code}).")
                else:
                    failures.append(f"HTTP {status_code or 'unknown'}: {error}")

        if failures:
            raise RuntimeError(
                f"Push delivery failed for {len(failures)} subscription(s): "
                + "; ".join(failures)
            )
        print(f"Sent {hours_before}-hour reminder: {title} ({len(subscriptions)} device(s)).")
    except Exception:
        release_reminder_claim(base_url, service_key, key)
        raise


def main():
    base_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    private_key = os.environ.get("VAPID_PRIVATE_KEY")
    admin_email = os.environ.get("VAPID_ADMIN_EMAIL") or "mailto:admin@goldenacrebc.co.uk"
    if not all((base_url, service_key, private_key)):
        raise RuntimeError(
            "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and VAPID_PRIVATE_KEY are required."
        )

    scheduled_items = []
    for schedule_file in ("events.json", "fixtures.json"):
        scheduled_items.extend(
            json.loads(Path(schedule_file).read_text(encoding="utf-8"))
        )

    due = due_event_reminders(scheduled_items, datetime.now(LONDON))
    if not due:
        print("No event reminders are due.")
        return

    subscriptions = load_subscriptions(base_url, service_key)
    if not subscriptions:
        print("No push subscriptions are registered.")
        return

    for event, hours_before in due:
        send_reminder(
            event,
            hours_before,
            subscriptions,
            base_url,
            service_key,
            private_key,
            admin_email,
        )


if __name__ == "__main__":
    try:
        main()
    except (HTTPError, URLError, RuntimeError, ValueError, KeyError) as error:
        print(f"Event push reminder run failed: {error}", file=sys.stderr)
        sys.exit(1)
