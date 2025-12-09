from flask import *
import db
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


# main customize site
@app.route('/customize')
def customize():
    user_content = session.get('content', db.default_content.copy())
    user_colors = session.get('colors', db.default_colors.copy())
    return render_template("customize.html", colors=user_colors, pallets=db.pallets, content=user_content)


@app.route("/site_style", methods=["POST"])
def site_style():
    style_value = request.form.get("style", "1")  # Default to "0" if not set
    session['style'] = style_value
    return "OK", 200


# for the user_defined_colors form
@app.route("/user_defined_colors", methods=["POST"])
def user_defined_colors():
    if request.data == b'RESET':
        session['colors'] = db.default_colors.copy()
        return "Reset Content", 205
    else:
        colors = session.get('colors', db.default_colors.copy())

        colors["--main-clr"] = request.form.get("--main-clr")
        colors["--secondary-clr"] = request.form.get("--secondary-clr")
        colors["--acc-clr"] = request.form.get("--acc-clr")
        session['colors'] = colors
    return "OK", 200


def generate_google_map_embed(address):
    encoded_address = urllib.parse.quote_plus(address)
    embed_url = f"https://maps.google.com/maps?&q={encoded_address}&output=embed"
    return embed_url


@app.route("/site_info", methods=["POST"])
def site_info():
    if request.data == b'RESET':
        session['user_info'] = db.default_info.copy()
        return "Reset Content", 205
    else:
        user_info = session.get('user_info', db.default_info.copy())

        for key in db.default_info:
            if request.form.get(key):
                user_info[key] = request.form.get(key)

        user_info["map"] = generate_google_map_embed(user_info["addr"])
        user_info["fb-link"] = f"https://www.facebook.com/{user_info['fb']}"

        session['user_info'] = user_info

    return "OK", 200


@app.route("/logo_uploader", methods=["POST"])
def logo_uploader():
    if request.data == b'RESET':
        session['logo_path'] = db.default_logo_path
        return "Reset Content", 205

    if not request.files['logo']:
        return "Bad reguest", 500

    file = request.files['logo']
    upload_folder = os.path.join(
        app.root_path, 'static/pages/uploads/logo')
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, file.filename))

    session['logo_path'] = f"/static/pages/uploads/logo/{file.filename}"
    return "OK", 200


# content (text)
@app.route("/site_content", methods=["POST"])
def site_content():
    if request.data == b'RESET':
        session['content'] = db.default_content.copy()
        return "Reset Content", 205
    else:
        content = session.get('content', db.default_content.copy())

        for key in request.form:
            if len(key.split()) > 1:
                split_key = key.split()
                content['services'][int(split_key[0]) -
                                    1][split_key[1]] = request.form.get(key)
            else:
                content[key] = request.form.get(key)

        session['content'] = content

    return "OK", 200


# stuff getter
@app.route("/pages/<path:filename>")
def iframe_page(filename):
    if "index.html" in filename:
        return render_template(f"pages/{filename}",
                               user_info=session.get(
                                   'user_info', db.default_info.copy()),
                               logo_path=session.get(
                                   'logo_path', db.default_logo_path),
                               content=session.get('content', db.default_content.copy()))

    if filename.endswith(".html"):
        return render_template(f"pages/{filename}", logo_path=session.get(
            'logo_path', db.default_logo_path),)

    return send_from_directory("/pages/", filename)


if __name__ == '__main__':
    app.run(debug=True)
