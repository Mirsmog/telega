from packages.bot.create_bot import InlineKeyboardButton, InlineKeyboardMarkup


def yes_or_no(obj_id):
    kb_1 = InlineKeyboardButton("Подтвердить", callback_data=f"accept_order:{obj_id}")
    kb_2 = InlineKeyboardButton("Отклонить", callback_data=f"cancel_order:{obj_id}")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1, kb_2)
    return re_kb


def okey():
    kb_1 = InlineKeyboardButton("Подтвердить", callback_data="ok_order_delete")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    return re_kb
