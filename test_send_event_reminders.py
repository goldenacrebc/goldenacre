import unittest
from datetime import datetime
from zoneinfo import ZoneInfo

from send_event_reminders import due_event_reminders, parse_event_time


LONDON = ZoneInfo("Europe/London")


class EventReminderTests(unittest.TestCase):
    def test_parses_common_event_times(self):
        self.assertEqual(parse_event_time("7:00 pm").isoformat(), "19:00:00")
        self.assertEqual(parse_event_time("10am").isoformat(), "10:00:00")
        self.assertEqual(parse_event_time("19:30").isoformat(), "19:30:00")
        self.assertIsNone(parse_event_time("All Day"))

    def test_only_due_not_disabled_events_are_returned(self):
        now = datetime(2026, 11, 9, 15, 5, tzinfo=LONDON)
        events = [
            {"date": "2026-11-09", "time": "7:00 pm", "title": "Open Event"},
            {"date": "2026-11-09", "time": "7:00 pm", "title": "Four Only", "notify": "4hr"},
            {"date": "2026-11-09", "time": "7:00 pm", "title": "Disabled", "notify": False},
            {"date": "2026-11-09", "time": "All Day", "title": "All Day"},
        ]

        due = due_event_reminders(events, now)

        self.assertEqual(
            [(event["title"], hours) for event, hours in due],
            [("Open Event", 4), ("Four Only", 4)],
        )


if __name__ == "__main__":
    unittest.main()
