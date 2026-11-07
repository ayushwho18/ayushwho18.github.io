# Sample task: vendor and contractor reconciliation

You are the accounts reviewer for Orchid Builders Pvt Ltd (fictional), a building contractor. It is 31 October 2026. Everything below is fictional. Read the policy, then work through all three tasks. Show your working, but finish each task with a clearly labelled final answer.

## Policy (use only these rules)
- **Scope:** All figures are in Indian rupees (INR). All parties and documents are fictional. Use ONLY the rules on this sheet; do not rely on outside tax rates or thresholds.
- **GST:** GST at 18% on goods and on contractor work, charged on the taxable value as shown on the purchase order or work order. GST is payable to the supplier on the corrected taxable value.
- **Goods bills:** Pay a goods invoice only for quantity actually received (GRN) at the PO rate. Pay an invoice only once; a repeat of the same invoice number and amount is a duplicate.
- **Payments:** A payment counts against a vendor only if the bank statement shows the money went to that vendor.
- **TDS rate:** On contractor bills deduct TDS on the taxable value (excluding GST) at 1% if the contractor's PAN is of an individual or HUF (4th character P or H); otherwise 2%. Deduct TDS on a bill if (a) that bill's taxable value exceeds 30,000, or (b) the contractor's total taxable value for the financial year, including this bill, exceeds 1,00,000. In case (b), if TDS was not deducted on earlier bills of the year because of these thresholds, deduct on the entire total to date, less any TDS already deducted. If TDS was deducted on earlier bills, deduct only on the current bill.
- **Retention:** Retain 5% of the taxable work value from each contractor bill.
- **Free-issue material:** Material issued free to a contractor is recovered from the bill at the purchase-order rate of that material, excluding GST.
- **Advances:** Any advance given to a contractor is recovered in full from its next running bill.
- **Extra items:** An item that is not in the work order is payable only if a variation order (VO) for it appears in the VO register; otherwise exclude it.
- **Liquidated damages:** Recover 0.5% of the bill's corrected taxable value for each completed week (full 7 days) of delay beyond the contractual completion date, capped at 5%. LD is a deduction from the bill and has no GST effect.
- **Prompt-payment discount:** If a bill is paid within 10 days after the bill date, the contractor allows a 2% discount on the corrected taxable value, and GST is then computed on the discounted value. If paid later, no discount applies.
- **Contractor net payable:** Net payable = taxable value (after any prompt-payment discount) + GST - retention - material recovery - advance recovery - liquidated damages - TDS. Retention is computed on the corrected taxable value (after any discount). TDS is computed as in the TDS rule.

## Task 1: What do we owe Kavya Cement Traders?

**Purchase order PO-114** (1 Oct 2026): OPC 53 Grade cement, per 50 kg bag, quantity 500 bags at Rs 390 per bag excluding GST, GST 18%.

**Goods received notes**
| GRN | Date | Bags received |
|---|---|---|
| GRN-501 | 4-Oct-2026 | 200 |
| GRN-502 | 12-Oct-2026 | 150 |
| GRN-503 | 21-Oct-2026 | 100 |

**Invoices received from vendor**
| Invoice | Invoice date | Booked on | Bags | Rate | Taxable | GST | Total |
|---|---|---|---|---|---|---|---|
| INV-8801 | 4-Oct-2026 | 4-Oct-2026 | 200 | 390 | 78,000 | 14,040 | 92,040 |
| INV-8802 | 12-Oct-2026 | 14-Oct-2026 | 150 | 405 | 60,750 | 10,935 | 71,685 |
| INV-8803 | 21-Oct-2026 | 23-Oct-2026 | 150 | 390 | 58,500 | 10,530 | 69,030 |
| INV-8802 | 12-Oct-2026 | 28-Oct-2026 | 150 | 405 | 60,750 | 10,935 | 71,685 |

**Our ledger for Kavya Cement Traders (as booked)**
| Date | Ref | Narration | Paid (Dr) | Billed (Cr) | Balance payable |
|---|---|---|---|---|---|
| 4-Oct-2026 | INV-8801 | Invoice booked |  | 92,040 | 92,040 |
| 10-Oct-2026 | PAY-301 | Payment to vendor | 92,040 |  | 0 |
| 14-Oct-2026 | INV-8802 | Invoice booked |  | 71,685 | 71,685 |
| 15-Oct-2026 | PAY-302 | Payment to vendor | 50,000 |  | 21,685 |
| 18-Oct-2026 | PAY-303 | Payment to vendor | 30,000 |  | -8,315 |
| 23-Oct-2026 | INV-8803 | Invoice booked |  | 69,030 | 60,715 |
| 28-Oct-2026 | INV-8802 | Invoice booked |  | 71,685 | 132,400 |

**Bank statement, October (outgoing)**
| Date | Ref | Mode | Amount | Beneficiary |
|---|---|---|---|---|
| 10-Oct-2026 | PAY-301 | NEFT | 92,040 | Kavya Cement Traders |
| 15-Oct-2026 | PAY-302 | NEFT | 50,000 | Sai Steel Traders |
| 18-Oct-2026 | PAY-303 | NEFT | 30,000 | Kavya Cement Traders |

**Questions**
1. What amount should we show as payable to Kavya Cement Traders at 31 October 2026?
2. List every adjustment you made to the booked balance, with its amount and the document that supports it.
3. State anything else you checked and found correct.

## Task 2: Contractor running bill RA-3

**Work order WO-77:** Mahadev Civil Works, Plastering, Block C. Rate Rs 180 per sq m. PAN AAAPM0000A (synthetic).

**Bill RA-3 as submitted (30-Oct-2026)**
| Item | Quantity (sq m) | Rate | Amount |
|---|---|---|---|
| Plastering, this bill | 1,300 | 185 | 240,500 |
| GST 18% |  |  | 43,290 |
| Gross bill |  |  | 283,790 |
| Less retention 5% |  |  | 12,025 |
| Less TDS 2% |  |  | 4,810 |
| Net claimed |  |  | 266,955 |

**Measurement book:** total plastering executed to date 1,800 sq m. Previously billed: RA-1 400 sq m, RA-2 300 sq m (both at Rs 180). TDS was deducted at the correct rate on RA-1 and RA-2.

**Material and advance register**
- IS-221 (14-Oct-2026): 60 bags OPC 53 cement issued free to Mahadev Civil Works.
- ADV-09 (3-Oct-2026): advance of Rs 20,000 paid to Mahadev Civil Works, not yet recovered.
- Cement purchase rate: see PO-114 above.

**Questions**
1. What is the correct net amount payable on RA-3?
2. Show the corrected taxable value, GST, retention, TDS, material recovery and advance recovery.
3. List every difference between the contractor's claim and your figures, with the document that supports each.

## Task 3: Contractor running bill RA-4 (tiling)

**Work order WO-82:** Rajesh & Sons Tiling, tiling, Block C. PAN ABCFR0000B (synthetic). Rates: item A Floor tiling Rs 250 per sq m; item B Wall tiling Rs 320 per sq m. Contractual completion date 15-Sep-2026; actual completion 12-Oct-2026.

**Bill RA-4 as submitted (30-Oct-2026); payment is scheduled for release on 11-Nov-2026**
| Item | Description | Quantity | Rate | Amount |
|---|---|---|---|---|
| A | Floor tiling | 120 sq m | 250 | 30,000 |
| B | Wall tiling | 50 sq m | 320 | 16,000 |
| C | Skirting (extra) | 40 running m | 80 | 3,200 |
|  | Taxable value claimed |  |  | 49,200 |
|  | GST 18% |  |  | 8,856 |
|  | Gross bill |  |  | 58,056 |
|  | Less retention 5% |  |  | 2,460 |
|  | Less TDS 2% of this bill |  |  | 984 |
|  | Net claimed |  |  | 54,612 |

**Measurement book (this bill)**
| Item | Measured |
|---|---|
| A Floor tiling, measured this bill | 120 sq m |
| B Wall tiling, measured this bill | 45 sq m |
| C Skirting, measured this bill | 40 running m |

**Earlier bills this financial year (taxable value; no TDS was deducted on any of them)**
| Bill | Taxable value |
|---|---|
| RA-1 | 28,000 |
| RA-2 | 29,000 |
| RA-3 | 27,000 |

**VO register**
| VO | Description | Status |
|---|---|---|
| VO-1 | Extra door frames, Block C | approved 2-Sep-2026 |


**Questions**
1. What is the correct net amount payable on RA-4?
2. Show the corrected taxable value, GST, retention, liquidated damages and TDS.
3. List every difference between the contractor's claim and your figures, and say what you checked and found correct.
