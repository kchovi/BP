from flask import *
import urllib.parse

app = Flask(__name__)
app.secret_key = "bp"


# main site
@app.route("/")
def home():
    return render_template("index.html", info=info)


@app.route("/basic_info", methods=["GET", "POST"])
def basic_info():
    for key in info:
        if request.form.get(key):
            info[key] = request.form.get(key)
    info["map"] = f"{generate_google_map_embed(info["addr"])}"
    info["fb-link"] = f"https://www.facebook.com/{info['fb']}"
    return redirect(url_for("customize"))


# basic info for the main site ( might wanna do this in a database but too lazy for that now)
info = {
    "site-name": "Váš Nadpis",
    "email": "jmeno@domain.com",
    "fb": "user.example",
    "tel": "+420 XXX XXX XXX",
    "addr": "17. listopadu 1192/12, 77900 Olomouc, Česko",
}


def generate_google_map_embed(address):
    encoded_address = urllib.parse.quote(address)
    embed_url = f"https://www.google.com/maps?q={encoded_address}&output=embed"
    return embed_url


# main customize site
@app.route('/customize')
def customize():
    # user_colors = session.get('colors', stock_colors.copy())
    user_colors = stock_colors.copy()
    return render_template("customize.html", colors=user_colors)


# default colors for the iframe (fix the css variable names !!!)
stock_colors = {
    "--bg-clr": "#fffafa",
    "--bg-acc-clr": "#ffeffb",
    "--clr-acc": "#f598b4"
}


# for the user_defined_colors form
@app.route("/user_defined_colors", methods=["POST"])
def user_defined_colors():
    if request.data == b'RESET':
        session['colors'] = stock_colors.copy()
        return "Reset Content", 205
    else:
        colors = session.get('colors')
        colors["--bg-clr"] = request.form.get("--bg-clr")
        colors["--bg-acc-clr"] = request.form.get("--bg-acc-clr")
        colors["--clr-acc"] = request.form.get("--clr-acc")
        session['colors'] = colors
    return "OK", 200



# stuff getter
@app.route("/pages/<path:filename>")
def iframe_page(filename):
    if filename == "index.html":
        return render_template("pages/index.html", info=info)

    if filename.endswith(".html"):
        return render_template(f"pages/{filename}")

    return send_from_directory("/pages/", filename)


# dynamic css for the iframe page/s, needs the headers cuz cloudflare was caching it and it stopped working
@app.route("/pages/style.css")
def dynamic_css():
    user_colors = session.get('colors', stock_colors)
    headers = {
        'Content-Type': 'text/css',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
    return render_template("pages/style.css", colors=user_colors), 200, headers
# the 200 response propably unnecesary, gonna keept it anyway


if __name__ == '__main__':
    app.run(debug=True)
