from datetime import date as datetime_date, datetime
from packages.bot.database import custumer_db, performer_db
from packages.bot.service import manage_region

from datetime import datetime
import base64
import random


class Customer:
    def __init__(
        self,
        user_id: int,
        username: str,
        date_registered: datetime = None,
        date_blok: datetime = None,
        orders: dict = None,
        register: bool = True,
        blok: bool = False,
        balance: float = 0,
        rating: int = 0,
        order_all: dict = {"done": 0, "cancel": 0},
        main_limit: int = 2,
        setting_limit: int = 2,
        name: str = None,
        phone: str = None,
        report: list = None,
        send_report: list = None,
        logs: list = None,
        ref_code: str = None,
        parent_ref_code: str = None,
        referrals: list = None,
        ref_balance: float = 0.0,
        total_earned: float = 0.0,
    ):
        self.user_id = user_id
        self.username = username
        self.date_registered = date_registered or datetime.now()
        self.date_blok = date_blok
        self.orders = orders or {}
        self.register = register
        self.blok = blok
        self.balance = balance
        self.rating = rating
        self.order_all = order_all
        self.main_limit = main_limit
        self.setting_limit = setting_limit
        self.name = name
        self.phone = phone
        self.report = report or []
        self.send_report = send_report or []
        self.logs = logs or []
        self.ref_code = ref_code
        self.parent_ref_code = parent_ref_code
        self.referrals = referrals or []
        self.ref_balance = ref_balance
        self.total_earned = total_earned

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "date_registered": self.date_registered,
            "date_blok": self.date_blok,
            "orders": self.orders,
            "register": self.register,
            "blok": self.blok,
            "balance": self.balance,
            "rating": self.rating,
            "order_all": self.order_all,
            "main_limit": self.main_limit,
            "setting_limit": self.setting_limit,
            "name": self.name,
            "phone": self.phone,
            "report": self.report,
            "send_report": self.send_report,
            "logs": self.logs,
            "ref_code": self.ref_code,
            "parent_ref_code": self.parent_ref_code,
            "referrals": self.referrals,
            "ref_balance": self.ref_balance,
            "total_earned": self.total_earned,
        }

    @classmethod
    async def create_user(cls, user_id, username, **kwargs):
        """Создает нового пользователя и возвращает его экземпляр."""
        user = cls(user_id, username, **kwargs)
        user_dict = user.to_dict()
        await custumer_db.add_new_custumer(user_dict)
        return user


class Performer:
    def __init__(
        self,
        user_id: int,
        username: str,
        date_registered: datetime = None,
        date_blok: datetime = None,
        orders: list = None,
        register: bool = True,
        blok: bool = False,
        balance: int = 300,
        tariff: bool = False,
        rating: int = 0,
        order_all: dict = {"done": 0, "cancel": 0},
        main_limit: int = 2,
        name: str = None,
        phone: str = None,
        cars: dict = {},
        all_regions: dict = None,
        report: list = None,
        send_report: list = None,
        logs: list = None,
        ref_code: str = None,
        parent_ref_code: str = None,
        referrals: list = None,
        ref_balance: float = 0.0,
        total_earned: float = 0.0,
    ):
        self.user_id = user_id
        self.username = username
        self.date_registered = date_registered or datetime.now()
        self.date_blok = date_blok
        self.orders = orders or []
        self.register = register
        self.blok = blok
        self.balance = balance
        self.tariff = tariff
        self.rating = rating
        self.order_all = order_all
        self.main_limit = main_limit
        self.name = name
        self.phone = phone
        self.cars = cars
        self.all_regions = all_regions or {}
        self.report = report or []
        self.send_report = send_report or []
        self.logs = logs or []
        self.ref_code = ref_code
        self.parent_ref_code = parent_ref_code
        self.referrals = referrals or []
        self.ref_balance = ref_balance
        self.total_earned = total_earned

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "date_registered": self.date_registered,
            "date_blok": self.date_blok,
            "orders": self.orders,
            "register": self.register,
            "blok": self.blok,
            "balance": self.balance,
            "tariff": self.tariff,
            "rating": self.rating,
            "order_all": self.order_all,
            "main_limit": self.main_limit,
            "name": self.name,
            "phone": self.phone,
            "cars": self.cars,
            "all_regions": self.all_regions,
            "report": self.report,
            "send_report": self.send_report,
            "logs": self.logs,
            "ref_code": self.ref_code,
            "parent_ref_code": self.parent_ref_code,
            "referrals": self.referrals,
            "ref_balance": self.ref_balance,
            "total_earned": self.total_earned,
        }

    @classmethod
    async def create_user(cls, user_id, username, **kwargs):
        """Создает нового пользователя и возвращает его экземпляр."""
        user = cls(user_id, username, **kwargs)
        await performer_db.add_new_performer(user.to_dict())
        return user
