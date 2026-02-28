html = open("c:/Users/I335869/ENP_HUB/hub-euanapratica/_html_content.txt", encoding="utf-8").read()
with open("c:/Users/I335869/ENP_HUB/hub-euanapratica/admin-leads-dashboard.html", "w", encoding="utf-8") as f:
    f.write(html)
import os
print("Done. Size:", os.path.getsize("c:/Users/I335869/ENP_HUB/hub-euanapratica/admin-leads-dashboard.html"))
