const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  // List all invoices
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  // Get invoice with a matching id
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      throw new ExpressError(`Canno't find invoice with id of: ${id}`, 404);
    }
    return res.json({ invoice: result.rows });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  // Create a new invoice
  try {
    const { comp_code, amt } = req.body;
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (e) {
    next(e);
  }
});
let paid_date;
router.put("/:id", async (req, res, next) => {
  // Update an invoice amount
  try {
    const { amt, paid } = req.body;

    const { id } = req.params;

    const invoiceResult = await db.query(
      `SELECT paid, paid_date, amt FROM invoices WHERE id = $1`,
      [id]
    );
    console.log(invoiceResult.rows[0].paid);
    if (invoiceResult.rows[0].paid === false && paid === "true") {
      paid_date = "2023-10-07T04:00:00.000Z";
    }
    if (invoiceResult.rows[0].paid === true && paid === false) {
      paid_date = null;
    } else {
      paid_date = invoiceResult.rows[0].paid_date;
    }
    console.log(paid_date);
    const result = await db.query(
      `UPDATE invoices SET amt = $1, paid_date = $2, paid = $3 WHERE id = $4 RETURNING *`,
      [amt, paid_date, paid, id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can not find invoice with id of: ${id}`, 404);
    }
    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  // Delete and invoice
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Can not find invoice with id of: ${id}`, 404);
    }
    return res.send({ msg: "invoice delted successfuly" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
