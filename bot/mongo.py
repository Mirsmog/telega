from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
url = "mongodb+srv://admin:rCelclBHmNbJex5I@cluster0.2omoret.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
# url = "mongodb+srv://admin:Admin1112@cluster0.bxojbvz.mongodb.net/?retryWrites=true&w=majority"
# url = 'mongodb://localhost:27017'
mongo = AsyncIOMotorClient(url)
performer_db = mongo.bot.performer # юзеры в боте  - исполнители
custumer_db = mongo.bot.custumer # юзеры в боте - заказчики
pre_order_db = mongo.main.pre_order # создание заявки - заказсчиком
user_db = mongo.main.users
manage_db = mongo.main.manage
subid_db = mongo.main.suborder
paymentinfo_db = mongo.main.payment

car_users_db = mongo.setting.cars
payments_db = mongo.setting.payments # общая база
server_db = mongo.test.server # общая база
order_db = mongo.main.orde # общая база
car_db = mongo.tech.car # база админки нужна тут тоже
type_db = mongo.tech.type # база админки нужна тут тоже
podtype_db = mongo.tech.podtype # база админки нужна тут тоже
region_db = mongo.maps.region # база админки нужна тут тожеф