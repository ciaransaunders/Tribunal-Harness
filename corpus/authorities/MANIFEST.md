# BAILII Authorities Corpus — Manifest

> Source: **BAILII** (www.bailii.org), fetched 20 June 2026 via the `bailii-case-download` skill.
> Each PDF is the full judgment with a "Retrieved from BAILII · <url>" provenance banner.
> Scope: the 24 authorities in `tribunal-harness/src/lib/verified-authorities.ts`.
> Result: **23 downloaded, 1 unavailable on BAILII.**

## Status

| Authority | BAILII judgment (actual) | In verified-authorities.ts | OK? |
|---|---|---|---|
| Polkey | Polkey v AE Dayton Services Ltd [1987] UKHL 8 | [1987] UKHL 8 | ✅ |
| BHS v Burchell | British Home Stores Ltd v Burchell [1978] UKEAT 108_78_2007 | [1978] UKEAT 0108_78_2007 | ✅ (leading-zero only) |
| Iceland Frozen Foods | Iceland Frozen Foods Ltd v Jones [1982] UKEAT 62_82_2907 | [1982] UKEAT 0062_82_2207 | ⚠️ wrong BAILII id |
| Williams v Compair Maxam | Williams v Compair Maxam Ltd [1982] UKEAT 372_81_2201 | [1982] ICR 156 | ✅ (ICR report vs neutral) |
| Western Excavating | Western Excavating (ECC) Ltd v Sharp [1977] EWCA Civ 2 | [1978] ICR 221 | ✅ (ICR report vs neutral) |
| Shamoon | Shamoon v CC RUC [2003] UKHL 11 | [2003] UKHL 11 | ✅ |
| Igen v Wong | IGEN Ltd v Wong [2005] EWCA Civ 142 | [2005] EWCA Civ 142 | ✅ |
| Anya | Anya v University of Oxford [2001] EWCA Civ 405 | [2001] EWCA Civ 405 | ✅ |
| Essop | Essop v Home Office [2017] UKSC 27 | [2017] UKSC 27 | ✅ |
| Homer | Homer v CC West Yorkshire [2012] UKSC 15 | [2012] UKSC 15 | ✅ |
| Pemberton | Pemberton v Inwood [2018] EWCA Civ 564 | [2018] EWCA Civ 564 | ✅ |
| Richmond Pharmacology | Richmond Pharmacology v Dhaliwal [2009] UKEAT 0458_08_1202 | [2009] UKEAT 0458_08_2403 | ⚠️ wrong BAILII id |
| Derbyshire | St Helens BC v Derbyshire [2007] UKHL 16 | [2007] UKHL 16 | ✅ |
| Environment Agency v Rowan | Environment Agency v Rowan [2007] UKEAT 0060_07_0111 | [2008] UKEAT 0060_07_2908 | ❌ wrong year (2007, not 2008) + id |
| Archibald | Archibald v Fife Council [2004] UKHL 32 | [2004] UKHL 32 | ✅ |
| Cavendish Munro | Cavendish Munro v Geduld [2009] UKEAT 0195_09_0608 | [2010] UKEAT 0195_09_0202 | ❌ wrong year (2009, not 2010) + id |
| Chesterton Global | Chesterton Global v Nurmohamed [2017] EWCA Civ 979 | [2017] EWCA Civ 979 | ✅ |
| Gunton | **not on BAILII** (1980 CA, pre-coverage) | [1981] 1 Ch 448 | ⬛ unavailable |
| Vento | Vento v CC West Yorkshire [2002] EWCA Civ 1871 | [2002] EWCA Civ 1871 | ✅ |
| Chagger | **Chagger v Abbey National [2009] EWCA Civ 1202** | [2009] EWCA Civ **1176** | ❌ **wrong case** — 1176 is *Choudhary v Bhatter* |
| Kucukdeveci | Kucukdeveci [2010] EUECJ C-555/07 | C-555/07 | ✅ (EUECJ path) |
| Robertson v Bexley | **Robertson v Bexley Community Centre [2003] EWCA Civ 576** | [2003] EWCA Civ **1012** | ❌ wrong number (576, not 1012) |
| Tesco v USDAW | Tesco Stores v USDAW [2024] UKSC 28 | [2024] UKSC 28 | ✅ |
| Uber | Uber BV v Aslam [2021] UKSC 5 | [2021] UKSC 5 | ✅ |

## Citation corrections needed in `src/lib/verified-authorities.ts`

These were exposed by grounding the citations against BAILII. **Legal content — needs owner review before applying.** Most serious first:

1. **Chagger** — `[2009] EWCA Civ 1176` is the **wrong case** (it is *Choudhary v Bhatter*). Correct: **`[2009] EWCA Civ 1202`** (*Chagger v Abbey National plc*).
2. **Robertson v Bexley** — `[2003] EWCA Civ 1012` is wrong. Correct: **`[2003] EWCA Civ 576`**.
3. **Environment Agency v Rowan** — `[2008] UKEAT 0060_07_2908` → correct **`[2007] UKEAT 0060_07_0111`** (year + id).
4. **Cavendish Munro** — `[2010] UKEAT 0195_09_0202` → correct **`[2009] UKEAT 0195_09_0608`** (year + id).
5. **Iceland Frozen Foods** — `[1982] UKEAT 0062_82_2207` → BAILII id **`[1982] UKEAT 62_82_2907`**.
6. **Richmond Pharmacology** — `[2009] UKEAT 0458_08_2403` → BAILII id **`[2009] UKEAT 0458_08_1202`**.

Not errors (different citation systems): Western Excavating and Williams v Compair Maxam are stored with their **ICR report** citation; BAILII uses the neutral citation. Both refer to the correct case. BHS v Burchell differs only by a leading zero.

## Notes

- Gunton v Richmond-upon-Thames LBC [1981] Ch 448 is a 1980 Court of Appeal contract case that predates BAILII's coverage; source it from a law report (ICLR/Westlaw/Lexis) if a full text is needed.
- These are **public** judgments. They are the raw corpus for the planned RAG pipeline (chunk → embed → pgvector) and as full-text backing for the citation validator. BAILII does not indicate subsequent treatment — it is not a citator.
