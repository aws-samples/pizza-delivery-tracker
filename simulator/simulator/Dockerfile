FROM python:3.9-slim-buster

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY simulator.py ./

CMD ["python3", "simulator.py"]
