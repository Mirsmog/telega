from packages.bot.create_bot import InlineKeyboardButton, InlineKeyboardMarkup


def first_menu():
    kb_1 = InlineKeyboardButton("Заказать транспорт или спецтехнику", callback_data="firsstart_custumer")
    kb_2 = InlineKeyboardButton("Зарегистрировать технику и получать заказы", callback_data="firsstart_performer")
    re_kb = InlineKeyboardMarkup()
    re_kb.row(kb_1)
    re_kb.row(kb_2)
    return re_kb


def balance():
    kb_1 = InlineKeyboardButton("Назад", callback_data="start_command")
    kb_3 = InlineKeyboardButton("Пополнить баланс", callback_data="payz_now")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_3)
    return re_kb
