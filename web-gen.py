import copy
from flask import *
import db
import urllib.parse
import os
from jinja2 import ChoiceLoader, FileSystemLoader
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "bp"
app.jinja_env.lstrip_blocks = True
app.jinja_env.trim_blocks = True

# jinja loader bcs i wanna separate the themes from thte main app
theme_base = os.path.join(app.root_path, "themes")

shared_templates = os.path.join(theme_base, "shared", "templates")
style1_templates = os.path.join(theme_base, "style1", "templates")
style2_templates = os.path.join(theme_base, "style2", "templates")

app.jinja_loader = ChoiceLoader([
    app.jinja_loader,
    FileSystemLoader(shared_templates),
    FileSystemLoader(style1_templates),
    FileSystemLoader(style2_templates)
])

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

    if 'logo' not in request.files:
        return "No file part", 400

    file = request.files['logo']

    if file.filename == '':
        return "No selected file", 400

    filename = secure_filename(file.filename)

    upload_folder = os.path.join(
        app.root_path,
        "themes",
        "shared",
        "static"
    )

    os.makedirs(upload_folder, exist_ok=True)

    save_path = os.path.join(upload_folder, filename)
    file.save(save_path)

    session['logo_path'] = f"/themes_shared_static/{filename}"

    return "OK", 200


# content (text)


@app.route("/site_content", methods=["POST"])
def site_content():

    content = session.get('content', copy.deepcopy(db.default_content))

    

    return "OK", 200


# stuff getter
@app.route("/preview/<path:filename>")
def preview(filename):
    style = session.get("style", "1")

    template_path = os.path.join(
        app.root_path,
        "themes",
        f"style{style}",
        "templates",
        filename
    )  # bcs flask can see the other templates folder

    if not os.path.exists(template_path):
        return "Template not found", 404

    with open(template_path, "r", encoding="utf-8") as f:
        template_content = f.read()

    return render_template_string(
        template_content,
        user_info=session.get('user_info', db.default_info.copy()),
        logo_path=session.get('logo_path', db.default_logo_path),
        content=session.get('content', db.default_content.copy()),
        user_colors=session.get('colors', db.default_colors.copy())
    )


@app.route("/themes_shared_static/<path:filename>")
def themes_shared_static(filename):
    shared_static_path = os.path.join(
        app.root_path, "themes", "shared", "static")
    return send_from_directory(shared_static_path, filename)


@app.route("/preview_static/<path:filename>")
def preview_static(filename):
    style = session.get("style", "1")

    static_path = os.path.join(
        app.root_path,
        "themes",
        f"style{style}",
        "static"
    )

    return send_from_directory(static_path, filename)


if __name__ == '__main__':
    app.run(debug=True)
