from packages.bot.database import region_db


async def get_text(order, performer, car):
    formatted_date = order["date"].strftime("%d.%m.%Y")
    region = await region_db.find_for_name(order["regions"])
    cars = performer["cars"][car]
    if order["type_order"] == "people":

        text = (
            f'Исполнитель заменил технику по заявке на перевозку пассажиров  #{order["order_number"]}\n\n'
            f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
            f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
            f'{"↓ " + str(order["distance"]) + " км | " + str(order["amount_people"]) + " чел"}\n'
            f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
            f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
            f'{performer["name"]}\n'
            f"❗Новая техника\n"
            f'{order["type_car"]}\n'
            f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
            f'{performer["phone"]}'
        )

    elif order["type_order"] == "a_b":
        text = (
            f'Исполнитель заменил технику по заявке на перевозку из точки А в В  #{order["order_number"]}\n\n'
            f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
            f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
            f'{"↓ " + str(order["distance"]) + " км"}\n'
            f'{order["drop_address"] if order["drop_address"] is not None else ""}\n'
            f'Везем: {order["info"]}\n'
            f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
            f'Стоимость: {order["price"] if order["price"] is not None else "Ожидаю предложения"}\n\n'
            f'{performer["name"]}\n'
            f"❗Новая техника\n"
            f'{order["type_car"]}\n'
            f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
            f'{performer["phone"]}'
        )

    elif order["type_order"] == "place":
        text = (
            f'Исполнитель заменил технику по заявке работа на месте  #{order["order_number"]}\n\n'
            f'{formatted_date} {order["time"] if order["time"] is not None else ""}\n'
            f'[{region["region_number"]}] {order["regions"]} - {region["region"][int(order["preregion"])]}, {order["address"]}\n'
            f'Требования и примечания: {order["requirements"] if order["requirements"] is not None else "нет"}\n'
            f'Стоимость: {order["cost"] if order["cost"] is not None else "Ожидаю предложения"}\n\n'
            f'{performer["name"]}\n'
            f"❗Новая техника\n"
            f'{order["type_car"]}\n'
            f'{cars["data"][4]} {cars["data"][0]} {cars["data"][1]}\n'
            f'{performer["phone"]}'
        )

    return text
