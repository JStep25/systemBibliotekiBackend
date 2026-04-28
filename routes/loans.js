const express = require("express");
const router = express.Router();
const pool = require("../db");
const { auth } = require("../middleware/auth");

router.post("/", auth, async (req, res) => {
  try {
    const { id_ksiazki } = req.body;
    const id_uzytkownika = req.user.id;

    const book = await pool.query("SELECT status FROM ksiazki WHERE id_ksiazki = $1", [id_ksiazki]);
    if (book.rows.length === 0 || book.rows[0].status !== "dostepna") {
      return res.status(400).json({ message: "Niedostępna" });
    }

    await pool.query("BEGIN");
    await pool.query("INSERT INTO wypozyczenia (id_ksiazki, id_uzytkownika, status_wypozyczenia) VALUES ($1, $2, 'aktywne')", [id_ksiazki, id_uzytkownika]);
    await pool.query("UPDATE ksiazki SET status = 'wypozyczona' WHERE id_ksiazki = $1", [id_ksiazki]);
    await pool.query("COMMIT");

    res.json({ message: "Wypożyczono" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

router.post("/return", auth, async (req, res) => {
  try {
    const { id_wypozyczenia } = req.body;

    const loanResult = await pool.query(
      "SELECT id_ksiazki FROM wypozyczenia WHERE id_wypozyczenia = $1",
      [id_wypozyczenia]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({ message: "Nie znaleziono wypożyczenia" });
    }

    const id_ksiazki = loanResult.rows[0].id_ksiazki;

    await pool.query("BEGIN");
    
    await pool.query(
      "UPDATE wypozyczenia SET status_wypozyczenia = 'oddana', data_zwrotu = NOW() WHERE id_wypozyczenia = $1",
      [id_wypozyczenia]
    );

    await pool.query(
      "UPDATE ksiazki SET status = 'dostepna' WHERE id_ksiazki = $1",
      [id_ksiazki]
    );

    await pool.query("COMMIT");
    res.json({ message: "Zwrócono" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Błąd zwrotu" });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, k.tytul, k.autor 
      FROM wypozyczenia w 
      JOIN ksiazki k ON w.id_ksiazki = k.id_ksiazki 
      WHERE w.id_uzytkownika = $1 
      ORDER BY w.id_wypozyczenia DESC`, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Błąd pobierania" });
  }
});

module.exports = router;