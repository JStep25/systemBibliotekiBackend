const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  try {
    const { imie, nazwisko, email, haslo } = req.body;
    if(!imie || !nazwisko || !email || !haslo) return res.status(400).json({message: "Wszystkie pola są wymagane"});

    const hashedPassword = await bcrypt.hash(haslo, 10);
    const result = await pool.query(
      `INSERT INTO uzytkownicy (imie, nazwisko, email, haslo, rola)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id_uzytkownika, imie, nazwisko, email, rola`,
      [imie, nazwisko, email, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Błąd rejestracji" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, haslo } = req.body;
    const result = await pool.query("SELECT * FROM uzytkownicy WHERE email = $1", [email]);

    if (result.rows.length === 0) return res.status(404).json({ message: "Użytkownik nie istnieje" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(haslo, user.haslo);
    if (!isMatch) return res.status(401).json({ message: "Błędne hasło" });

    const token = jwt.sign(
      { id: user.id_uzytkownika, role: user.rola },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { id: user.id_uzytkownika, imie: user.imie, role: user.rola }
    });
  } catch (err) {
    res.status(500).json({ error: "Błąd logowania" });
  }
});

module.exports = router;