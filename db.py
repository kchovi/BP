
# default colors for the iframe
default_colors = {
    "--main-clr": "#f7f7ff",
    "--secondary-clr": "#eeeeee",
    # "--acc-clr": "#f598b4"
    "--acc-clr": "#FFA348"
}


pallets = [
    {
        "--main-clr": "#E9E8ED",
        "--secondary-clr": "#DCDAD5",
        "--acc-clr": "#E67E22"
    },
    {
        "--main-clr": "#F4F4F2",
        "--secondary-clr": "#DAD7CD",
        "--acc-clr": "#BC6C25"
    },
    {
        "--main-clr": "#F5F6FA",
        "--secondary-clr": "#D9E1E8",
        "--acc-clr": "#0077B6"
    },
    {
        "--main-clr": "#FAFAFA",
        "--secondary-clr": "#EDE8E3",
        "--acc-clr": "#E07A5F"
    },
    {
        "--main-clr": "#F2F2F2",
        "--secondary-clr": "#E0E0E0",
        "--acc-clr": "#FCA311"
    },
    {
        "--main-clr": "#F4E1D2",
        "--secondary-clr": "#E9AFA3",
        "--acc-clr": "#9A1750"
    },
    {
        "--main-clr": "#F7F7F7",
        "--secondary-clr": "#C0D6DF",
        "--acc-clr": "#4A6FA5"
    },
    {
        "--main-clr": "#EAEAEA",
        "--secondary-clr": "#A4C3B2",
        "--acc-clr": "#2E8B57"
    },
    {
        "--main-clr": "#F5E6E8",
        "--secondary-clr": "#D5C6E0",
        "--acc-clr": "#6B4E71"
    },
    {
        "--main-clr": "#FFF8E7",
        "--secondary-clr": "#FFD2A5",
        "--acc-clr": "#FF5E5B"
    }

]


# basic info for the main site ( might wanna do this in a database but too lazy for that now)
default_info = {
    "site-name": "Váš Nadpis",
    "email": "jmeno@domain.com",
    "fb": "user.example",
    "tel": "+420 XXX XXX XXX",
    "addr": "17. listopadu 1192/12, 77900 Olomouc, Česko",
    "map": "https://www.google.com/maps?q=17.%20listopadu%201192/12%2C%2077900%20Olomouc%2C%20%C4%8Cesko&output=embed",
}


default_logo_path = "/themes_shared_static/logo-placeholder.svg"


default_content = {
    "about_me": {"text": "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Proin mattis lacinia justo. Duis risus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos. Etiam quis quam. Aliquam in lorem sit amet leo accumsan lacinia. Donec vitae arcu. Nunc dapibus tortor vel mi dapibus sollicitudin.",
                 "visible": True
                 },
    "services": [
        {
            "name": "Služba 1",
            "text": "Integer vulputate sem a nibh rutrum consequat. Nullam justo enim, consectetuer nec, ullamcorper ac, vestibulum in, elit. Vestibulum erat nulla, ullamcorper nec, rutrum non, nonummy ac, erat. Nullam rhoncus aliquam metus.",
            "img": "/themes_shared_static/555.png",
            "visible": True
        },
        {
            "name": "Služba 2",
            "text": "Integer vulputate sem a nibh rutrum consequat. Nullam justo enim, consectetuer nec, ullamcorper ac, vestibulum in, elit. Vestibulum erat nulla, ullamcorper nec, rutrum non, nonummy ac, erat. Nullam rhoncus aliquam metus.",
            "img": "/themes_shared_static/555.png",
            "visible": True
        },
    ]
}
