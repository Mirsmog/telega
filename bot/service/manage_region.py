from packages.bot.database import custumer_db, region_db, performer_db


async def format_region_data(region):
    region_number = str(region["region_number"]).zfill(2)
    subtypes = {area: False for area in region["region"]}
    return {region_number: {"name": region["region_name"], "subreg": subtypes}}


async def fetch_and_format_regions():
    regions = await region_db.fetch_regions()
    formatted_data = {}
    for region in regions:
        region_data = await format_region_data(region)
        formatted_data.update(region_data)
    return formatted_data


def replace_key(d, old_key, new_key):
    if old_key in d:
        d[new_key] = d.pop(old_key)
    return d


async def update_user_regions(user_regions, all_regions_data):
    if not user_regions:
        return all_regions_data.copy()

    # Создаем копию словаря user_regions
    updated_regions = user_regions.copy()

    # Добавляем новые регионы, которые есть в all_regions_data, но отсутствуют в user_regions
    for region_key, region_value in all_regions_data.items():
        if region_key not in updated_regions:
            updated_regions[region_key] = region_value.copy()
        else:
            # Обновляем подрегионы для существующих регионов
            user_subregs = updated_regions[region_key]["subreg"]
            for subreg, subvalue in region_value["subreg"].items():
                if subreg not in user_subregs:
                    user_subregs[subreg] = subvalue
                # если subreg уже существует, его значение не перезаписывается

    # Удаляем регионы, которых нет в all_regions_data
    for key in list(updated_regions.keys()):
        if key not in all_regions_data:
            del updated_regions[key]

    return updated_regions


async def update_all_users_with_regions():
    all_regions_data = await fetch_and_format_regions()

    users = await performer_db.find_all_performer()
    for user in users:
        user_id = str(user["_id"])
        user_regions = user.get("all_regions", {})

        merged_regions = await update_user_regions(user_regions, all_regions_data)
        await performer_db.update_user_regions(user_id, merged_regions)
