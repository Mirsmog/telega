


def delete_no_obj(data_info):
    for data in data_info:
        data.pop("_id", None)
    return data_info



