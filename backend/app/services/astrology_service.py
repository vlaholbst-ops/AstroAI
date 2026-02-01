from astro_calculator import calculate_natal_chart, calculate_houses

def get_natal_chart(birth_dt, lat, lon):
    planets = calculate_natal_chart(birth_dt, lat, lon)
    houses = calculate_houses(birth_dt, lat, lon)
    return {"planets": planets, "houses": houses}
