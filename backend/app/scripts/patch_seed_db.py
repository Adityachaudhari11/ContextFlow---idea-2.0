import re
import os

filepath = os.path.join(os.path.dirname(__file__), "seed_db.py")

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace demo accounts
new_accounts = """        demo_accounts = [
            BankAccount(account_number="8888", nickname="Savings Account", account_type="savings", balance=Decimal("124500.00")),
            BankAccount(account_number="9999", nickname="Current Account", account_type="current", balance=Decimal("380200.00")),
            BankAccount(account_number="7777", nickname="Credit Account", account_type="credit", balance=Decimal("-42750.00")),
            BankAccount(account_number="6666", nickname="Salary Account", account_type="salary", balance=Decimal("68300.00")),
        ]"""
content = re.sub(r'        demo_accounts = \[\n.*?        \]', new_accounts, content, flags=re.DOTALL)

# Replace demo transactions
new_transactions = """        demo_transactions = [
            # Account 8888 — Savings
            AccountTransaction(account_number="8888", amount=Decimal("3200"), merchant_name="Amazon Shopping", merchant_category="Shopping", transaction_date=date(2026, 5, 26), transaction_type="debit"),
            AccountTransaction(account_number="8888", amount=Decimal("55000"), merchant_name="Salary Credit", merchant_category="Income", transaction_date=date(2026, 5, 24), transaction_type="credit"),
            AccountTransaction(account_number="8888", amount=Decimal("1850"), merchant_name="Electricity Bill", merchant_category="Utilities", transaction_date=date(2026, 5, 22), transaction_type="debit"),
            AccountTransaction(account_number="8888", amount=Decimal("450"), merchant_name="Zomato Order", merchant_category="Food", transaction_date=date(2026, 5, 19), transaction_type="debit"),
            AccountTransaction(account_number="8888", amount=Decimal("5000"), merchant_name="ATM Withdrawal", merchant_category="Cash", transaction_date=date(2026, 5, 15), transaction_type="debit"),
            # Account 9999 — Current
            AccountTransaction(account_number="9999", amount=Decimal("120000"), merchant_name="NEFT Transfer In", merchant_category="Transfer", transaction_date=date(2026, 5, 27), transaction_type="credit"),
            AccountTransaction(account_number="9999", amount=Decimal("45000"), merchant_name="Vendor Payment", merchant_category="Business", transaction_date=date(2026, 5, 25), transaction_type="debit"),
            AccountTransaction(account_number="9999", amount=Decimal("18200"), merchant_name="GST Payment", merchant_category="Tax", transaction_date=date(2026, 5, 23), transaction_type="debit"),
            AccountTransaction(account_number="9999", amount=Decimal("200000"), merchant_name="Client Receipt", merchant_category="Business", transaction_date=date(2026, 5, 20), transaction_type="credit"),
            AccountTransaction(account_number="9999", amount=Decimal("3600"), merchant_name="Office Supplies", merchant_category="Office", transaction_date=date(2026, 5, 18), transaction_type="debit"),
            # Account 7777 — Credit
            AccountTransaction(account_number="7777", amount=Decimal("680"), merchant_name="Swiggy Order", merchant_category="Food", transaction_date=date(2026, 5, 25), transaction_type="debit"),
            AccountTransaction(account_number="7777", amount=Decimal("2500"), merchant_name="UNKNOWN_MERCH_INT", merchant_category="International", transaction_date=date(2026, 5, 22), transaction_type="debit"),
            AccountTransaction(account_number="7777", amount=Decimal("4299"), merchant_name="Myntra Purchase", merchant_category="Shopping", transaction_date=date(2026, 5, 20), transaction_type="debit"),
            AccountTransaction(account_number="7777", amount=Decimal("15000"), merchant_name="Payment Received", merchant_category="Payment", transaction_date=date(2026, 5, 17), transaction_type="credit"),
            AccountTransaction(account_number="7777", amount=Decimal("820"), merchant_name="BookMyShow", merchant_category="Entertainment", transaction_date=date(2026, 5, 14), transaction_type="debit"),
            # Account 6666 — Salary
            AccountTransaction(account_number="6666", amount=Decimal("5000"), merchant_name="Grocery Store UPI", merchant_category="Groceries", transaction_date=date(2026, 5, 26), transaction_type="debit"),
            AccountTransaction(account_number="6666", amount=Decimal("72000"), merchant_name="Salary Credit", merchant_category="Income", transaction_date=date(2026, 5, 24), transaction_type="credit"),
            AccountTransaction(account_number="6666", amount=Decimal("5500"), merchant_name="Flipkart Order", merchant_category="Shopping", transaction_date=date(2026, 5, 22), transaction_type="debit"),
            AccountTransaction(account_number="6666", amount=Decimal("649"), merchant_name="Netflix Subscription", merchant_category="Entertainment", transaction_date=date(2026, 5, 19), transaction_type="debit"),
            AccountTransaction(account_number="6666", amount=Decimal("2000"), merchant_name="UPI Transfer Out", merchant_category="Transfer", transaction_date=date(2026, 5, 16), transaction_type="debit"),
        ]"""
content = re.sub(r'        demo_transactions = \[\n.*?        \]', new_transactions, content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("seed_db.py patched successfully")
