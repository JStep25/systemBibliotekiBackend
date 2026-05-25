const express = require("express");
const router = express.Router();
const pool = require("../db");
const { auth } = require("../middleware/auth");
const { admin } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_ksiazki, tytul, autor, status 
      FROM ksiazki 
      ORDER BY id_ksiazki DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GET BOOKS ERROR:", err);
    res.status(500).json({ message: "Błąd pobierania książek" });
  }
});


router.post("/", auth, admin, async (req, res) => {
  try {
    const { tytul, autor } = req.body;

    if (!tytul || !autor || tytul.trim() === "" || autor.trim() === "") {
      return res.status(400).json({ message: "Tytuł i autor są wymagani" });
    }

    const result = await pool.query(
      `
      INSERT INTO ksiazki (tytul, autor, status)
      VALUES ($1, $2, 'dostepna')
      RETURNING id_ksiazki, tytul, autor, status
      `,
      [tytul.trim(), autor.trim()]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ADD BOOK ERROR:", err);
    res.status(500).json({ message: "Błąd dodawania książki" });
  }
});


router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query("DELETE FROM wypozyczenia WHERE id_ksiazki = $1", [id]);
    const result = await pool.query("DELETE FROM ksiazki WHERE id_ksiazki = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Nie znaleziono książki" });
    }

    res.json({ message: "Książka została usunięta" });
  } catch (err) {
    console.error("DELETE BOOK ERROR:", err);
    res.status(500).json({ message: "Błąd usuwania książki" });
  }
});

router.put("/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { tytul, autor, status } = req.body;

    const result = await pool.query(
      "UPDATE ksiazki SET tytul = $1, autor = $2, status = $3 WHERE id_ksiazki = $4 RETURNING *",
      [tytul, autor, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Nie znaleziono książki" });
    }

    res.json({ message: "Zaktualizowano pomyślnie", book: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera podczas edycji" });
  }
});

module.exports = router;