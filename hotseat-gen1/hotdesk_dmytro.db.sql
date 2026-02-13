BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "users" (
	"Email"	TEXT,
	"FName"	TEXT NOT NULL,
	"LName"	TEXT NOT NULL,
	PRIMARY KEY("Email")
);
CREATE TABLE IF NOT EXISTS "bookings" (
	"Booking Code"	TEXT,
	"Start Date"	TEXT NOT NULL,
	"End Date"	TEXT NOT NULL,
	"Room Name"	TEXT NOT NULL,
	"Cost"	REAL NOT NULL,
	"Email"	TEXT NOT NULL,
	PRIMARY KEY("Booking Code"),
	FOREIGN KEY("Email") REFERENCES "users"("Email"),
	FOREIGN KEY("Room Name") REFERENCES "rooms"("Room Name")
);
CREATE TABLE IF NOT EXISTS "rooms" (
	"Room Name"	TEXT,
	"Capacity"	INTEGER NOT NULL,
	"Desk Cost"	REAL NOT NULL,
	PRIMARY KEY("Room Name")
);
COMMIT;
