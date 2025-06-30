from flask import *
import urllib.parse
import os

app = Flask(__name__)
app.secret_key = "bp"
app.jinja_env.lstrip_blocks = True
app.jinja_env.trim_blocks = True

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
    return render_template("customize.html", colors=user_colors, pallets=pallets)


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
        colors = session.get('colors', default_colors.copy())

        colors["--main-clr"] = request.form.get("--main-clr")
        colors["--secondary-clr"] = request.form.get("--secondary-clr")
        colors["--acc-clr"] = request.form.get("--acc-clr")
        session['colors'] = colors
    return "OK", 200


pallets = [
    {
        "--main-clr": "#037171",
        "--secondary-clr": "#00B9AE",
        "--acc-clr": "#03312E"
    },
    {
        "--main-clr": "#A1CCA5",
        "--secondary-clr": "#8FB996",
        "--acc-clr": "#709775"
    },
    {
        "--main-clr": "#5F4BB6",
        "--secondary-clr": "#86A5D9",
        "--acc-clr": "#202A25"
    }, 
    {
        "--main-clr": "#274029",
        "--secondary-clr": "#315C2B",
        "--acc-clr": "#181F1C"
    },
]


@app.route("/logo_uploader", methods=["POST"])
def logo_uploader():
    file = request.files['logo']
    upload_folder = os.path.join(app.root_path, 'static/pages/uploads/logo')
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, file.filename))

    session['logo_filename'] = file.filename
    session['logo_path'] = f"/static/pages/uploads/logo/{file.filename}"

    return "OK", 200


logo_filename = "logo-placeholder.png"
logo_path = f"{'/static/pages/uploads/logo/' + logo_filename}"

default_logo_path = "/static/pages/uploads/logo/logo-placeholder.png"


# stuff getter
@app.route("/pages/<path:filename>")
def iframe_page(filename):
    if filename == "index.html":
        return render_template("pages/index.html",
                               user_info=session.get(
                                   'user_info', default_info.copy()),
                               logo_path=session.get('logo_path', default_logo_path))

    if filename.endswith(".html"):
        return render_template(f"pages/{filename}")

    return send_from_directory("/pages/", filename)


if __name__ == '__main__':
    app.run(debug=True)
