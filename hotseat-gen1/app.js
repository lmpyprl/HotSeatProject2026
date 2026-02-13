//stephen was here
// Dmytro was here#
// hello kyle
// kyle was here 
//hello anthony

const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
const { init, all, get, run } = require("./db");

const app = express();
const PORT = 3000;

// Handlebars
app.engine(
  "hbs",
  engine({
    extname: "hbs",
    helpers: {
      eq: (a, b) => String(a) === String(b),
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Seat generator: A1..H17
function generateSeats() {
  const rows = "ABCDEFGH".split("");
  const seats = [];
  for (const row of rows) {
    for (let n = 1; n <= 17; n++) {
      seats.push(`${row}${n}`);
    }
  }
  return seats;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Home
app.get("/", async (req, res) => {
  res.render("home", { title: "HotSeat Gen 1" });
});

// Login (fake for Gen 1)
app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

// Rooms list
app.get("/rooms", async (req, res) => {
  const date = req.query.date || todayISO();
  const rooms = await all(`SELECT * FROM rooms ORDER BY id`);

  // For each room, count how many bookings exist that day (simple indicator)
  const roomsWithCounts = [];
  for (const r of rooms) {
    const countRow = await get(
      `SELECT COUNT(*) as c FROM bookings WHERE room_id = ? AND date = ?`,
      [r.id, date]
    );
    roomsWithCounts.push({ ...r, bookedCount: countRow.c });
  }

  res.render("rooms", {
    title: "Available Rooms",
    rooms: roomsWithCounts,
    date,
  });
});

// Single room: seat map + booking form
app.get("/rooms/:id", async (req, res) => {
  const roomId = req.params.id;
  const date = req.query.date || todayISO();

  const room = await get(`SELECT * FROM rooms WHERE id = ?`, [roomId]);
  if (!room) return res.status(404).send("Room not found");

  const seats = generateSeats(); // A1..H17

  const booked = await all(
    `SELECT seat FROM bookings WHERE room_id = ? AND date = ?`,
    [roomId, date]
  );
  const bookedSet = new Set(booked.map((b) => b.seat));

  const seatObjects = seats.map((s) => ({
    name: s,
    isBooked: bookedSet.has(s),
  }));

  // DEBUG (do this once to verify)
  console.log("Render room:", room.name, "date:", date, "seats:", seatObjects.length);

 res.render("room", {
  title: room.name,
  room,
  date,
  seats: seatObjects,
  defaultStart: "09:00",
  defaultEnd: "10:00",
});

});


// Create booking
app.post("/book", async (req, res) => {
  const { room_id, seat, booked_by, date, start_time, end_time } = req.body;

  // Basic validation
  if (!room_id || !seat || !booked_by || !date || !start_time || !end_time) {
    return res.status(400).send("Missing booking details");
  }

  // Gen 1 rule: seat can only be booked once per room per date (simple)
  const existing = await get(
    `SELECT id FROM bookings WHERE room_id = ? AND date = ? AND seat = ?`,
    [room_id, date, seat]
  );
  if (existing) {
    return res.redirect(`/rooms/${room_id}?date=${encodeURIComponent(date)}&err=seat_taken`);
  }

  await run(
    `INSERT INTO bookings (room_id, seat, booked_by, date, start_time, end_time)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [room_id, seat, booked_by, date, start_time, end_time]
  );

  res.redirect("/bookings");
});

// List bookings
app.get("/bookings", async (req, res) => {
  const bookings = await all(`
    SELECT b.*, r.name as room_name
    FROM bookings b
    JOIN rooms r ON r.id = b.room_id
    ORDER BY b.date DESC, b.start_time DESC
  `);

  res.render("bookings", { title: "My Bookings", bookings });
});

// Edit booking form
app.get("/bookings/:id/edit", async (req, res) => {
  const id = req.params.id;
  const booking = await get(
    `SELECT b.*, r.name as room_name FROM bookings b JOIN rooms r ON r.id = b.room_id WHERE b.id = ?`,
    [id]
  );
  if (!booking) return res.status(404).send("Booking not found");

  res.render("editBooking", { title: "Edit Booking", booking });
});

// Update booking
app.post("/bookings/:id/edit", async (req, res) => {
  const id = req.params.id;
  const { booked_by, date, start_time, end_time } = req.body;

  const booking = await get(`SELECT * FROM bookings WHERE id = ?`, [id]);
  if (!booking) return res.status(404).send("Booking not found");

  await run(
    `UPDATE bookings
     SET booked_by = ?, date = ?, start_time = ?, end_time = ?
     WHERE id = ?`,
    [booked_by, date, start_time, end_time, id]
  );

  res.redirect("/bookings");
});

// Cancel booking
app.post("/bookings/:id/delete", async (req, res) => {
  const id = req.params.id;
  await run(`DELETE FROM bookings WHERE id = ?`, [id]);
  res.redirect("/bookings");
});

// Boot
(async () => {
  await init();
  app.listen(PORT, () => {
    console.log(`✅ HotSeat Gen 1 running at http://localhost:${PORT}`);
  });
})();
