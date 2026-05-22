import mysql.connector

# MySQL connection
db = mysql.connector.connect(
    host="mysql-174b47aa-smartcartai.k.aivencloud.com",
    port=10401,
    user="avnadmin",
    password=os.environ.get("DB_PASSWORD"),
    database="defaultdb",
    ssl_disabled=False
)

cursor = db.cursor()

# users table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255)
)
""")

# cart table
cursor.execute("""
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_name VARCHAR(255),
    price FLOAT,
    quantity INT,
    image VARCHAR(500)
)
""")

db.commit()

print("Tables created successfully!")