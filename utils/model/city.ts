class City {
  key: string | null; // Unique city key from AccuWeather API
  name: string | null; // Localized city name
  country: string | null; // Localized country name
  latitude: number | null; // Latitude (nullable)
  longitude: number | null; // Longitude (nullable)
  type: string; // Type of city, e.g., primary or secondary
  temperature: number | null; // Current temperature (nullable)
  weatherText: string | null; // Weather description (nullable)

  constructor(
    key: string | null,
    name: string | null,
    country: string | null,
    latitude: number | null = null,
    longitude: number | null = null,
    type: string = "secondary",
    temperature: number | null = null,
    weatherText: string | null = null,
  ) {
    this.key = key;
    this.name = name;
    this.country = country;
    this.latitude = latitude;
    this.longitude = longitude;
    this.type = type;
    this.temperature = temperature;
    this.weatherText = weatherText;
  }

  public getKey(): string | null {
    return this.key;
  }

  public setKey(key: string | null) {
    this.key = key;
  }

  public getName(): string | null {
    return this.name;
  }

  public setName(name: string | null) {
    this.name = name;
  }

  public getLatitude(): number | null {
    return this.latitude;
  }

  public setLatitude(latitude: number | null) {
    this.latitude = latitude;
  }

  public getLongitude(): number | null {
    return this.longitude;
  }

  public setLongitude(longitude: number | null) {
    this.longitude = longitude;
  }

  /**
   * Converts the City object to a plain object for AsyncStorage.
   */
  toObject() {
    return {
      key: this.key,
      name: this.name,
      country: this.country,
      latitude: this.latitude,
      longitude: this.longitude,
      type: this.type,
      temperature: this.temperature,
      weatherText: this.weatherText,
    };
  }

  /**
   * Creates a City instance from a plain object (useful when retrieving from AsyncStorage).
   */
  static fromObject(obj: {
    key: string;
    name: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    type: string | null;
    temperature: number | null;
    weatherText: string | null;
  }): City {
    // Ensure type defaults to 'secondary' if not provided
    const type = obj.type || "secondary";
    return new City(
      obj.key,
      obj.name,
      obj.country,
      obj.latitude,
      obj.longitude,
      type,
      obj.temperature,
      obj.weatherText,
    );
  }
}

export default City;
