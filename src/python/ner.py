#!/usr/bin/python

import sys, json, io

import stanza

from mitie import *

#MITIE_MODELS_PATH = "./MITIE-models/model.dat"
#stanza.download('en')

input_stream = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')

def get_possible_ner_tags():
    return [
        "CARDINAL",
        "DATE",
        "EVENT",
        "FAC",
        "GPE",
        "LANGUAGE",
        "LAW",
        "LOC",
        "MONEY",
        "NORP",
        "ORDINAL",
        "ORG",
        "PERCENT",
        "PERSON",
        "PRODUCT",
        "QUANTITY",
        "TIME",
        "WORK_OF_ART"
    ]

if __name__=='__main__':
    nlp = stanza.Pipeline(lang='en', processors='tokenize,ner,lemma')
    input_json = None
    for line in input_stream:
        input_json = json.loads(line)
        method = input_json['method']
        output = None
        if method == 'get_possible_ner_tags':
            tags = get_possible_ner_tags()
            output = {"request": input_json, "response": {"tags": tags}}
        else:
            text = input_json['params']['text']
            doc = nlp(text)
            if method == 'tokenize':
                output = [token.text for sent in doc.sentences for token in sent.tokens]
                output = {"request": input_json, "response": {"tokens": output}}
            elif method == 'extract_entities':
                output = [dict(entity=' '.join([(token.lemma.title() if token.text.istitle() else token.lemma)
                                                for sent in nlp(ent.text).sentences for token in sent.words]),
                               tag=ent.type,
                               start_char=ent.start_char,
                               end_char=ent.end_char
                               ) for ent in doc.ents]
                output = {"request": input_json, "response": {"named_entities": output}}
        output_json = json.dumps(output, ensure_ascii=False).encode('utf-8')
        sys.stdout.buffer.write(output_json)
        print()
