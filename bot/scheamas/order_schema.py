from datetime import date as datetime_date, datetime

from packages.bot.database import order_db


class Create_order:

    def __init__(
        self,
        type_order,
        type_car,
        type_tip_car,
        podtype_car,
        amount_car,
        date,
        address,
        regions,
        region_number,
        preregion,
        customer,
        tariff,
        viptarif,
        create_date,
        log=[],
        time=None,
        send_all=False,
        send_status=False,
        distance=None,
        drop_address=None,
        amount_people=None,
        info=None,
        order_number=None,
        requirements=None,
        price=None,
        coment=None,
        status="create",
        performer={},
    ):
        self.order_number = order_number
        self.type_order = type_order
        self.type_car = type_car
        self.type_tip_car = type_tip_car
        self.podtype_car = podtype_car
        self.amount_car = amount_car
        self.create_date = create_date
        self.log = log
        self.date = date
        self.time = time
        self.send_status = send_status
        self.address = address
        self.info = info
        self.drop_address = drop_address
        self.regions = regions
        self.region_number = region_number
        self.preregion = preregion
        self.requirements = requirements
        self.distance = distance
        self.amount_people = amount_people
        self.price = price
        self.status = status
        self.customer = customer
        self.performer = performer
        self.tariff = tariff
        self.viptarif = viptarif
        self.send_all = send_all
        self.coment = coment

    def to_dict(self):
        """Преобразует объект заявки в словарь для сохранения в БД."""
        return {
            "order_number": self.order_number,
            "type_order": self.type_order,
            "type_car": self.type_car,
            "type_tip_car": self.type_tip_car,
            "podtype_car": self.podtype_car,
            "amount_car": self.amount_car,
            "date": self.date,
            "time": self.time,
            "send_status": self.send_status,
            "address": self.address,
            "drop_address": self.drop_address,
            "create_date": self.create_date,
            "log": self.log,
            "regions": self.regions,
            "region_number": self.region_number,
            "preregion": self.preregion,
            "requirements": self.requirements,
            "distance": self.distance,
            "amount_people": self.amount_people,
            "info": self.info,
            "price": self.price,
            "status": self.status,
            "customer": self.customer,
            "performer": self.performer,
            "tarif": self.tariff,
            "viptarif": self.viptarif,
            "send_all": self.send_all,
            "coment": self.coment,
        }

    @classmethod
    async def create_order(
        cls,
        type_order,
        type_car,
        type_tip_car,
        podtype_car,
        amount_car,
        date,
        address,
        regions,
        region_number,
        preregion,
        customer,
        create_date,
        log,
        send_status,
        tariff,
        viptarif,
        send_all,
        coment=None,
        time=None,
        distance=None,
        amount_people=None,
        info=None,
        order_number=None,
        requirements=None,
        price=None,
        performer=None,
        drop_address=None,
    ):
        """Создает новый ордер и сохраняет его в БД."""

        # Если объект date является экземпляром datetime.date, преобразовать его в datetime
        if isinstance(date, datetime_date) and not isinstance(date, datetime):
            date = datetime(date.year, date.month, date.day)

        # Создание экземпляра ордера
        order = cls(
            type_order,
            type_car,
            type_tip_car,
            podtype_car,
            amount_car,
            date,
            address,
            regions,
            region_number,
            preregion,
            customer,
            tariff,
            viptarif,
            create_date,
            log,
            coment=coment,
            send_all=send_all,
            time=time,
            distance=distance,
            amount_people=amount_people,
            send_status=send_status,
            info=info,
            order_number=order_number,
            requirements=requirements,
            price=price,
            performer=performer,
            drop_address=drop_address,
        )

        order_id = await order_db.add_new_order(order.to_dict())

        return order_id
