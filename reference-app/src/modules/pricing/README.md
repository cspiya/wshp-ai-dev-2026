# `pricing` module

Pure, deterministic quote calculation. Amounts are integer minor units. The
order is deliberately fixed: list price, then coupon, then group discount,
then VAT. Group discount rounds down; VAT rounds half up.
