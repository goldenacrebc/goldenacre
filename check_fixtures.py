import os
import json
from datetime import datetime, timezone, timedelta
from pywebpush import webpush, WebPushException

def main():
    # 1. Load configuration secrets from GitHub environment
    private_key = os.environ.get("VAPID_PRIVATE_KEY")
    public_key = os.environ.get("VAPID_PUBLIC_KEY")
    admin_email = os.environ.get("VAPID_ADMIN_EMAIL", "mailto:admin@goldenacrebc.co.uk")

    if not private_key:
        print("VAPID private key missing. Skipping notifications.")
        return

    # 2. Read local JSON schedules
    all_items = []
    try:
        with open("fixtures.json", "r") as f:
            fixtures = json.load(f)
            for item in fixtures:
                item["isFixture"] = True
                all_items.append(item)
    except Exception as e:
        print("Could not read fixtures.json:", e)

    try:
        with open("events.json", "r") as f:
            events = json.load(f)
            for item in events:
                if item.get("notify") is not False:
                    all_items.append(item)
    except Exception as e:
        print("Could not read events.json:", e)

    # 3. Target time calculation (Looking for events roughly 2 hours from now)
    now_utc = datetime.now(timezone.utc)
    target_time = now_utc + timedelta(hours=2)
    target_date_str = target_time.strftime("%Y-%m-%d")

    print(f"Checking schedules for date: {target_date_str}")

    # (Optional) Load subscription tokens stored by users in a subscriptions.json file
    subscriptions = []
    if os.path.exists("subscriptions.json"):
        try:
            with open("subscriptions.json", "r") as f:
                subscriptions = json.load(f)
        except Exception:
            pass

    if not subscriptions:
        print("No user push subscriptions found yet.")
        return

    # 4. Check items matching 2 hours ahead
    for item in all_items:
        if item.get("date") == target_date_str:
            title = item.get("title", "Goldenacre BC Reminder")
            description = item.get("description", "Fixture starting soon.")
            payload = json.dumps({
                "title": title,
                "body": f"Starting at {item.get('time', 'soon')}. {description}"
            })

            # Send push message to all subscribed browsers
            for sub in subscriptions:
                try:
                    webpush(
                        subscription_info=sub,
                        data=payload,
                        vapid_private_key=private_key,
                        vapid_claims={"sub": admin_email}
                    )
                    print(f"Successfully sent notification for: {title}")
                except WebPushException as ex:
                    print(f"Web push failed: {ex}")

if __name__ == "__main__":
    main()
