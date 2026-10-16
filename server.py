import http.server
import json
import os
import random
import urllib.parse

PORT = 8000
DATA_FILE = "bookings.json"


class BowlingClubHandler(http.server.SimpleHTTPRequestHandler):

  def do_GET(self):
    if self.path == "/" or self.path == "":
      self.path = "/rinks_booking_system.html"
    return super().do_GET()

  def do_POST(self):
    if self.path == "/api/register":
      content_length = int(self.headers.get("Content-Length", 0))
      post_data = self.rfile.read(content_length).decode("utf-8")
      params = json.loads(post_data)

      if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
          data = json.load(f)
      else:
        data = {"daily_bookings": {}, "matches": []}

      date_val = params.get("date")
      current_bookings = data["daily_bookings"].get(date_val, 0)

      if current_bookings >= 6:
        self.send_response(400)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(
            json.dumps({"success": False, "error": "Daily capacity reached."})
            .encode("utf-8")
        )
        return

      new_match = {
          "date": date_val,
          "time": params.get("time"),
          "comp": params.get("competition"),
          "round": params.get("round"),
          "p1": params.get("player_a"),
          "p2": params.get("player_b"),
          "marker": params.get("marker", ""),
          "rink": None,
      }
      data["matches"].append(new_match)
      data["daily_bookings"][date_val] = current_bookings + 1

      with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

      self.send_response(200)
      self.send_header("Content-Type", "application/json")
      self.end_headers()
      self.wfile.write(json.dumps({"success": True}).encode("utf-8"))

    elif self.path == "/api/delete":
      content_length = int(self.headers.get("Content-Length", 0))
      post_data = self.rfile.read(content_length).decode("utf-8")
      params = json.loads(post_data)

      target_date = params.get("date")
      p1 = params.get("p1")
      p2 = params.get("p2")

      if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
          data = json.load(f)
      else:
        return

      match_found = False
      new_matches = []
      for m in data["matches"]:
        if (
            not match_found
            and m["date"] == target_date
            and m["p1"] == p1
            and m["p2"] == p2
        ):
          match_found = True
        else:
          new_matches.append(m)

      if match_found:
        data["matches"] = new_matches
        if (
            target_date in data["daily_bookings"]
            and data["daily_bookings"][target_date] > 0
        ):
          data["daily_bookings"][target_date] -= 1

        with open(DATA_FILE, "w") as f:
          json.dump(data, f, indent=4)

      self.send_response(200)
      self.send_header("Content-Type", "application/json")
      self.end_headers()
      self.wfile.write(json.dumps({"success": True}).encode("utf-8"))

    elif self.path == "/api/draw":
      content_length = int(self.headers.get("Content-Length", 0))
      post_data = self.rfile.read(content_length).decode("utf-8")
      params = json.loads(post_data)
      target_date = params.get("date")

      if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
          data = json.load(f)
      else:
        return

      available_rinks = [1, 2, 3, 4, 5, 6]
      for m in data["matches"]:
        if m["date"] == target_date and m["rink"] in available_rinks:
          available_rinks.remove(m["rink"])

      for m in data["matches"]:
        if m["date"] == target_date and m["rink"] is None and available_rinks:
          chosen_rink = random.choice(available_rinks)
          available_rinks.remove(chosen_rink)
          m["rink"] = chosen_rink

      with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

      self.send_response(200)
      self.send_header("Content-Type", "application/json")
      self.end_headers()
      self.wfile.write(json.dumps({"success": True}).encode("utf-8"))


if __name__ == "__main__":
  server_address = ("", PORT)
  httpd = http.server.HTTPServer(server_address, BowlingClubHandler)
  print(f"Server started! Open http://localhost:{PORT} in your browser.")
  try:
    httpd.serve_forever()
  except KeyboardInterrupt:
    print("\nShutting down server...")
    httpd.server_close()