from PyPDF2 import PdfFileWriter, PdfFileReader
import requests
from bs4 import BeautifulSoup
from tika import parser
import re
import pandas as pd

def parse_report_by_url(url):
    response = requests.get(url)
    file = open("tmp/daily_slides.pdf", "wb")
    file.write(response.content)
    file.close()

    inputpdf = PdfFileReader(open("tmp/daily_slides.pdf", "rb"))
    output = PdfFileWriter()
    output.addPage(inputpdf.getPage(2))
    with open("tmp/manufacturer_table.pdf", "wb") as outputStream:
        output.write(outputStream)

    parsed_pdf = parser.from_file("tmp/manufacturer_table.pdf")
    data = parsed_pdf["content"]
    lines = data.split("\n")
    toReturn = []
    for line in lines:
        if(line.strip() != ''):
            toReturn.append(line.strip())
    return toReturn

def search_manufacturer(report):
    found = False
    shift = 0
    items = []
    manufacturers = []
    doses = []
    for line in report:
        if (found):
            shift += 1
        if (found == True and (shift > 3 and shift < 7)):
            dose = line
            doses.append(int(dose.replace(',', '')))
        elif (found == True and (shift <= 3)):
            manufacturer = (line.split(' ราย')[0])
            manufacturers.append(manufacturer)
        if (line.find('จ าแนกตามบ') >= 0):
            found = True
    for i in range(len(doses)):
        items.append((manufacturers[i], doses[i]))
    items = dict(items)

    if ('Sinovac' not in items or items['Sinovac'] < 5000000):
        return False
    else:
        return items

df = pd.read_json("tmp/vaccine-manufacturer-timeseries.json")
if len(df)>0:
    latest_date = pd.to_datetime(df.iloc[-1]['date'])
else:
    latest_date = pd.to_datetime("2021-07-01")
url = "https://ddc.moph.go.th/vaccine-covid19/diaryPresentMonth/0" + str(latest_date.month) + "/10/2021"
req = requests.get(url)
soup = BeautifulSoup(req.content, 'html.parser')
day = latest_date.day
manufacturer_timeseries = df
rows = soup.find_all("td", text=re.compile('สไลด์นำเสนอ'))
for row in rows[latest_date.day:len(rows)]:
    tr = row.parent
    report_url = tr.find("a").get("href")
    print('--'+tr.text.strip()+'--')
    print(report_url)
    report = parse_report_by_url(report_url)
    data = search_manufacturer(report)
    if(data != False):
        if(day+1 < 10):
            data["date"] = "2021-07-0"+str(day+1)
        else:
            data["date"] = "2021-07-"+str(day+1)
        data["date"] = pd.to_datetime(data["date"])
        manufacturer_timeseries = manufacturer_timeseries.append(data,ignore_index=True)
    day += 1

manufacturer_timeseries['date']=manufacturer_timeseries['date'].astype(str)
manufacturer_timeseries.to_json("tmp/vaccine-manufacturer-timeseries.json",orient="records",indent=2)
print('saved!')

