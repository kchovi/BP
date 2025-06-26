from flask import *
import urllib.parse

app = Flask(__name__)
app.secret_key = "bp"


# main site
@app.route("/")
def home():
    return render_template("index.html")



def generate_google_map_embed(address):
    encoded_address = urllib.parse.quote_plus(address)
    embed_url = f"https://maps.google.com/maps?&q={encoded_address}&output=embed"
    return embed_url


@app.route("/site_info", methods=["POST"])
def site_info():
    if request.data == b'RESET':
        session['user_info'] = default_info.copy()
        return "Reset Content", 205
    else:
        user_info = session.get('user_info', default_info.copy())

        for key in default_info:
            if request.form.get(key):
                user_info[key] = request.form.get(key)

        user_info["map"] = generate_google_map_embed(user_info["addr"])
        user_info["fb-link"] = f"https://www.facebook.com/{user_info['fb']}"

        session['user_info'] = user_info
        print(user_info)

    return "OK", 200


# basic info for the main site ( might wanna do this in a database but too lazy for that now)
default_info = {
    "site-name": "Váš Nadpis",
    "email": "jmeno@domain.com",
    "fb": "user.example",
    "tel": "+420 XXX XXX XXX",
    "addr": "17. listopadu 1192/12, 77900 Olomouc, Česko",
    "map": "https://www.google.com/maps?q=17.%20listopadu%201192/12%2C%2077900%20Olomouc%2C%20%C4%8Cesko&output=embed",
}


# main customize site


@app.route('/customize')
def customize():
    user_colors = session.get('colors', default_colors.copy())
    return render_template("customize.html", colors=user_colors)


# default colors for the iframe
default_colors = {
    "--main-clr": "#ffeffb",
    "--secondary-clr": "#fffafa",
    "--acc-clr": "#f598b4"
}

colors = {
    "--main-clr": "#ffeffb",
    "--secondary-clr": "#fffafa",
    "--acc-clr": "#f598b4"
}


# for the user_defined_colors form
@app.route("/user_defined_colors", methods=["POST"])
def user_defined_colors():
    if request.data == b'RESET':
        session['colors'] = default_colors.copy()
        return "Reset Content", 205
    else:
        colors = session.get('colors')
        colors["--main-clr"] = request.form.get("--main-clr")
        colors["--secondary-clr"] = request.form.get("--secondary-clr")
        colors["--acc-clr"] = request.form.get("--acc-clr")
        session['colors'] = colors
    return "OK", 200


# stuff getter
@app.route("/pages/<path:filename>")
def iframe_page(filename):
    if filename == "index.html":
        return render_template("pages/index.html", user_info=session.get('user_info', default_info.copy()))

    if filename.endswith(".html"):
        return render_template(f"pages/{filename}")

    return send_from_directory("/pages/", filename)


if __name__ == '__main__':
    app.run(debug=True)
