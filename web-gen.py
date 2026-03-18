from flask import *
import db
import urllib.parse
import os
import re
from jinja2 import ChoiceLoader, FileSystemLoader
from werkzeug.utils import secure_filename


app = Flask(__name__)
app.secret_key = "bp"
app.jinja_env.lstrip_blocks = True
app.jinja_env.trim_blocks = True

# jinja loader bcs i wanna separate the themes from the main app
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

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "svg"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# main site
@app.route("/")
def home():
    return render_template("index.html")


# customize site
@app.route('/customize')
def customize():
    user_content = session.get('content', db.default_content.copy())
    user_colors = session.get('colors', db.default_colors.copy())
    last_tab = session.get('last_tab')
    return render_template("customize.html", colors=user_colors, pallets=db.pallets, content=user_content, last_tab=last_tab)


@app.route("/site_style", methods=["POST"])
def site_style():
    style_value = request.form.get("style", "1")
    session['style'] = style_value
    return Response(status=204)


# for the user_defined_colors form
@app.route("/user_defined_colors", methods=["POST"])
def user_defined_colors():
    if request.data == b'RESET':
        session['colors'] = db.default_colors.copy()
        return "Reset Content", 205

    colors = session.get('colors', db.default_colors.copy())
    colors["--main-clr"] = request.form.get("--main-clr")
    colors["--secondary-clr"] = request.form.get("--secondary-clr")
    colors["--acc-clr"] = request.form.get("--acc-clr")
    session['colors'] = colors
    return Response(status=204)


# info
@app.route("/site_info", methods=["POST"])
def site_info():
    if request.form.get("reset"):
        session['user_info'] = db.default_info.copy()
        return "", 205

    user_info = session.get('user_info', db.default_info.copy())
    for key in request.form:
        if key == "fb":
            user_info["fb-link"] = f"https://www.facebook.com/{key}"

        user_info[key] = request.form.get(key, "").strip()

    session['user_info'] = user_info
    return "OK", 200


@app.route("/generate_map_url", methods=["POST"])
def generate_map_url():
    addr = request.form.get("addr", "")
    return {"url": generate_google_map_embed(addr)}


def generate_google_map_embed(address):
    encoded_address = urllib.parse.quote_plus(address)
    return f"https://maps.google.com/maps?&q={encoded_address}&output=embed"


# logo uploader
@app.route("/logo_uploader", methods=["POST"])
def logo_uploader():
    if request.form.get("reset"):
        session['logo_path'] = db.default_logo_path
        return "", 205

    file = request.files.get("logo")

    if not file or not file.filename:
        return {"errors": {"logo": ["Please select a file to upload"]}}, 400

    if not allowed_file(file.filename):
        return {"errors": {"logo": ["Allowed types: jpg, jpeg, png, gif, svg"]}}, 400

    filename = secure_filename(file.filename)
    upload_folder = os.path.join(
        app.root_path, "themes/shared/static/uploads/logo")
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, filename))

    session['logo_path'] = f"/themes_shared_static/uploads/logo/{filename}"
    return "OK", 200


# content - sections, images, and so on
@app.route("/site_content", methods=["POST"])
def site_content():
    if request.data == b'RESET':
        session['content'] = db.default_content.copy()
        return "Reset Content", 205

    data = request.get_json()
    sections = data["sections"]
    content = {"sections": sections}
    for section in content["sections"]:
        if section["type"] == "service":
            if not section["img"]:
                section["img"] = db.default_content["sections"][2]["img"]
    session['content'] = content
    return "OK", 200


# save last active tab (keeps per-session state)
@app.route('/save_last_tab', methods=['POST'])
def save_last_tab():
    data = request.get_json(silent=True) or {}
    tab = data.get('tab')
    if tab:
        session['last_tab'] = tab
    return "OK", 200


# template loading for themes
@app.route("/preview/<path:filename>")
def preview(filename):
    style = session.get("style", "1")
    template_path = os.path.join(
        app.root_path, "themes", f"style{style}", "templates", filename)

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


# themes shared static
@app.route("/themes_shared_static/<path:filename>")
def themes_shared_static(filename):
    shared_static_path = os.path.join(
        app.root_path, "themes", "shared", "static")
    return send_from_directory(shared_static_path, filename)


# other NOT shared static
@app.route("/preview_static/<path:filename>")
def preview_static(filename):
    style = session.get("style", "1")
    static_path = os.path.join(
        app.root_path, "themes", f"style{style}", "static")
    return send_from_directory(static_path, filename)


if __name__ == '__main__':
    app.run(debug=True)
