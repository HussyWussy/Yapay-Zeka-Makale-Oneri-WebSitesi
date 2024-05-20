from nlp_handler import nlp_handler
from flask_cors import CORS
from flask import Flask, g, jsonify, request, send_file,send_from_directory
from bson.json_util import dumps
from urllib.parse import unquote

handler = None

app = Flask(__name__)

CORS(app)

def load_handler():
    global handler
    handler = nlp_handler()

@app.route('/api')
def test(): 
    return (jsonify("test"))
    # results = handler.get_fasttext_results("C")
    # return(jsonify(results))

@app.route('/api/getrecomended',methods=['POST'])
def get_recomended():
    data = request.json
    interests = data['interests']
    history = data['history']
    bad_history = data['bad_history']
    fasttext_results = handler.get_fasttext_results(interests=interests,approved_history=history,disapproved_history=bad_history)
    scibert_results = handler.get_scibert_results(interests=interests,approved_history=history,disapproved_history=bad_history)
    top_keys = handler.get_frequent_keys(30) # kaç tane anahtar alınacağı yazılıyor fonksiyonun içine 
    return jsonify({'fasttext_results' : fasttext_results , 'scibert_results' : scibert_results , 'top_keys' : top_keys })



if __name__ == '__main__':
    load_handler()
    app.run(debug=False)