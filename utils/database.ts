// utils/database.ts
import * as SQLite from 'expo-sqlite';

export class DB {
  private static db: SQLite.WebSQLDatabase | null = null;

  static initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.db) {
          this.db = SQLite.openDatabase('WeatherApp.db');
        }

        this.db.transaction(tx => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS cities (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              key TEXT NOT NULL,
              name TEXT NOT NULL,
              country TEXT NOT NULL
            );`,
            [],
            () => {
              console.log('Database initialized successfully');
              resolve();
            },
            (_, error) => {
              console.error('Error creating table:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Error initializing database:', error);
        reject(error);
      }
    });
  }

  static async saveCity(cityData: { key: string; name: string; country: string }): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      this.db?.transaction(tx => {
        tx.executeSql(
          'INSERT INTO cities (key, name, country) VALUES (?, ?, ?)',
          [cityData.key, cityData.name, cityData.country],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
}