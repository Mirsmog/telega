from packages.bot.mongo import paymentinfo_db


async def add_info(user_id, coment, operation, date, amount, status, who, order_id=None):
    payments = {
        "coment": coment,
        "user_id": user_id,
        "operation": operation,
        "date": date,
        "amount": amount,
        "status": status,
        "who": who,
        "order_id": order_id,
    }
    await paymentinfo_db.insert_one(payments)


async def count_doc():
    return await paymentinfo_db.count_documents({})
