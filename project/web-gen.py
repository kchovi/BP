from flask import *
import urllib.parse

app = Flask(__name__)
app.secret_key = "bp"

# main site


@app.route("/", methods=["GET", "POST"])
def home():
    if request.method == "POST":
        for key in info:
            if request.form.get(key):
                info[key] = request.form.get(key)
        info["map"] = f"{generate_google_map_embed(info["addr"])}"
        return redirect(url_for("customize"))

    return render_template("index.html")


# basic info for the main site

info = {
    "site-name": "Váš Nadpis",
    "email": "jmeno@domain.com",
    "fb": "https://www.facebook.com/",
    "tel": "+420 XXX XXX XXX",
    "addr": "17. listopadu 1192/12, 77900 Olomouc, Česko",
}


def generate_google_map_embed(address):
    encoded_address = urllib.parse.quote(address)
    embed_url = f"https://www.google.com/maps?q={encoded_address}&output=embed"
    return embed_url

# adding the map for the preset location


info["map"] = f"{generate_google_map_embed(info["addr"])}"


@app.route("/customize", methods=["GET", "POST"])
def customize():
    if request.method == "POST":
        if "reset" in request.form:
            global current_colors
            current_colors = stock_colors.copy()
        else:

            current_colors["--bg-clr"] = request.form.get("--bg-clr")
            current_colors["--bg-acc-clr"] = request.form.get("--bg-acc-clr")
            current_colors["--clr-acc"] = request.form.get("--clr-acc")
        return redirect(url_for("customize"))

    return render_template("customize.html", colors=current_colors)


current_colors = {
    "--bg-clr": "#fffafa",
    "--bg-acc-clr": "#ffeffb",
    "--clr-acc": "#f598b4"
}

stock_colors = {
    "--bg-clr": "#fffafa",
    "--bg-acc-clr": "#ffeffb",
    "--clr-acc": "#f598b4"
}


@app.route("/pages/<path:filename>")
def iframe_page(filename):
    if filename == "index.html":
        return render_template("pages/index.html", info=info)

    if filename.endswith(".html"):
        return render_template(f"pages/{filename}")

    return send_from_directory("/pages/", filename)


@app.route("/pages/style.css")
def dynamic_css():
    return render_template("pages/style.css", colors=current_colors), 200, {'Content-Type': 'text/css'}


if __name__ == '__main__':
    app.run(host='192.168.68.101')
