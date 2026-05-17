from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import mysql.connector
import os

app = Flask(__name__)
CORS(app)

def get_db():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST"),
        port=int(os.environ.get("DB_PORT", 3306)),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        database=os.environ.get("DB_NAME"),
        ssl_disabled=False
    )
def ensure_user(cursor):
    cursor.execute("SELECT id FROM users WHERE id = 1")
    user = cursor.fetchone()
    if not user:
        cursor.execute(
            "INSERT INTO users (id, name, email, password) VALUES (%s, %s, %s, %s)",
            (1, "Aryan", "aryan@test.com", "123456")
        )

@app.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

@app.route("/")
def home():
    return "SmartCart AI MySQL Backend Running 🚀"

@app.route("/signup", methods=["POST", "OPTIONS"])
def signup():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"})

    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({"message": "Name, email and password required"}), 400

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
            db.close()
            return jsonify({"message": "Email already registered"}), 400

        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
            (name, email, password)
        )

        db.commit()
        cursor.close()
        db.close()

        return jsonify({"message": "Signup successful ✅"})

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"})

    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email and password required"}), 400

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, name, email FROM users WHERE email = %s AND password = %s",
            (email, password)
        )

        user = cursor.fetchone()
        cursor.close()
        db.close()

        if not user:
            return jsonify({"message": "Invalid email or password"}), 401

        return jsonify({
            "message": "Login successful ✅",
            "user": user
        })

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/products")
def products():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM products")
        data = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/cart/<int:user_id>")
def get_cart(user_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT cart.product_id AS id,
                   cart.quantity,
                   products.name,
                   products.price,
                   products.image,
                   products.category
            FROM cart
            JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = %s
        """, (user_id,))

        data = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify(data)

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/add-to-cart", methods=["POST", "OPTIONS"])
def add_to_cart():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"})

    try:
        data = request.get_json()
        user_id = data.get("user_id", 1)
        product_id = data.get("product_id")

        db = get_db()
        cursor = db.cursor(dictionary=True)

        ensure_user(cursor)

        cursor.execute("SELECT id FROM products WHERE id=%s", (product_id,))
        product = cursor.fetchone()

        if not product:
            cursor.close()
            db.close()
            return jsonify({"message": "Product not found"}), 404

        cursor.execute(
            "SELECT * FROM cart WHERE user_id=%s AND product_id=%s",
            (user_id, product_id)
        )
        item = cursor.fetchone()

        if item:
            cursor.execute(
                "UPDATE cart SET quantity = quantity + 1 WHERE user_id=%s AND product_id=%s",
                (user_id, product_id)
            )
        else:
            cursor.execute(
                "INSERT INTO cart (user_id, product_id, quantity) VALUES (%s, %s, %s)",
                (user_id, product_id, 1)
            )

        db.commit()
        cursor.close()
        db.close()

        return jsonify({"message": "Added to cart ✅"})

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/remove-cart", methods=["POST", "OPTIONS"])
def remove_cart():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"})

    try:
        data = request.get_json()
        user_id = data.get("user_id", 1)
        product_id = data.get("product_id")

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "DELETE FROM cart WHERE user_id=%s AND product_id=%s",
            (user_id, product_id)
        )

        db.commit()
        cursor.close()
        db.close()

        return jsonify({"message": "Removed from cart ❌"})

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/wishlist/<int:user_id>")
def get_wishlist(user_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT products.*
            FROM wishlist
            JOIN products ON wishlist.product_id = products.id
            WHERE wishlist.user_id = %s
        """, (user_id,))

        data = cursor.fetchall()
        cursor.close()
        db.close()

        return jsonify(data)

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/add-to-wishlist", methods=["POST", "OPTIONS"])
def add_to_wishlist():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"})

    try:
        data = request.get_json()
        user_id = data.get("user_id", 1)
        product_id = data.get("product_id")

        db = get_db()
        cursor = db.cursor(dictionary=True)

        ensure_user(cursor)

        cursor.execute(
            "SELECT * FROM wishlist WHERE user_id=%s AND product_id=%s",
            (user_id, product_id)
        )
        item = cursor.fetchone()

        if item:
            cursor.execute(
                "DELETE FROM wishlist WHERE user_id=%s AND product_id=%s",
                (user_id, product_id)
            )
            message = "Removed from wishlist ❌"
        else:
            cursor.execute(
                "INSERT INTO wishlist (user_id, product_id) VALUES (%s, %s)",
                (user_id, product_id)
            )
            message = "Added to wishlist ❤️"

        db.commit()
        cursor.close()
        db.close()

        return jsonify({"message": message})

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/checkout", methods=["POST", "OPTIONS"])
def checkout():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"})

    try:
        data = request.get_json()
        user_id = data.get("user_id", 1)
        address = data.get("address", "")
        phone = data.get("phone", "")
        payment_method = data.get("payment_method", "Cash on Delivery")

        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT cart.product_id, cart.quantity, products.price
            FROM cart
            JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = %s
        """, (user_id,))

        cart_items = cursor.fetchall()

        if not cart_items:
            cursor.close()
            db.close()
            return jsonify({"message": "Cart empty ❌"}), 400

        total = sum(float(item["price"]) * int(item["quantity"]) for item in cart_items)

        cursor.execute("""
            INSERT INTO addresses
            (user_id, full_name, phone, address_line, city, state, pincode)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            "Customer",
            phone,
            address,
            "Thane",
            "Maharashtra",
            "400000"
        ))

        db.commit()
        address_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO orders
            (user_id, address_id, total_amount, payment_method, order_status)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_id,
            address_id,
            total,
            payment_method,
            "Confirmed"
        ))

        db.commit()
        order_id = cursor.lastrowid

        for item in cart_items:
            cursor.execute("""
                INSERT INTO order_items
                (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
            """, (
                order_id,
                item["product_id"],
                item["quantity"],
                item["price"]
            ))

        cursor.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "message": "Order placed successfully ✅",
            "order_id": order_id,
            "total": total
        })

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/orders/<int:user_id>")
def get_orders(user_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                orders.id,
                orders.total_amount,
                orders.payment_method,
                orders.order_status,
                orders.created_at,
                addresses.address_line,
                addresses.phone,
                products.name AS product_name,
                products.image AS product_image,
                products.price AS product_price,
                order_items.quantity
            FROM orders
            JOIN addresses ON orders.address_id = addresses.id
            JOIN order_items ON orders.id = order_items.order_id
            JOIN products ON order_items.product_id = products.id
            WHERE orders.user_id = %s
            ORDER BY orders.created_at DESC
        """, (user_id,))

        data = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(data)

    except Exception as e:
        return jsonify({"message": str(e)}), 500
@app.route("/add-address", methods=["POST", "OPTIONS"])
def add_address():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"})

    try:
        data = request.get_json()

        db = get_db()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO addresses
            (user_id, full_name, phone, address_line, city, state, pincode)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get("user_id"),
            data.get("full_name"),
            data.get("phone"),
            data.get("address_line"),
            data.get("city"),
            data.get("state"),
            data.get("pincode")
        ))

        db.commit()
        cursor.close()
        db.close()

        return jsonify({"message": "Address saved successfully ✅"})

    except Exception as e:
        return jsonify({"message": str(e)}), 500


@app.route("/addresses/<int:user_id>")
def get_addresses(user_id):
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT *
            FROM addresses
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))

        data = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(data)

    except Exception as e:
        return jsonify({"message": str(e)}), 500
@app.route("/images/<filename>")
def images(filename):
    image_folder = os.path.join(os.path.dirname(__file__), "image")
    return send_from_directory(image_folder, filename)

if __name__ == "__main__":
    app.run(debug=False, port=5000, use_reloader=False)