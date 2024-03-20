#!/usr/bin/python

import sys, json, io

import stanza

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


def get_range(doc, ent):
    start = 0
    end = 0
    for sent in doc.sentences:
        if sent.tokens[-1].start_char < ent.start_char:
            start += len(sent.tokens)
        else:
            for token in sent.tokens:
                if token.start_char < ent.start_char:
                    start = start + 1
                else:
                    break
        if sent.tokens[-1].end_char < ent.end_char:
            end += len(sent.tokens)
        else:
            for token in sent.tokens:
                if token.end_char < ent.end_char:
                    end = end + 1
                else:
                    break

    return {"start": start, "end": end}


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
                output = [
                    dict(entity=' '.join([(token.lemma.title() if token.text.istitle() else token.lemma)
                                    for sent in nlp(ent.text).sentences for token in sent.words]).replace(" 's", "")
                    if ent.type != "NORP" else ' '.join([(token.lemma.title() if token.text.istitle() else token.lemma)
                                    for sent in nlp(ent.text).sentences for token in sent.words]).replace(" 's", "'s"),
                    tag=ent.type,
                    range=get_range(doc, ent)
                    ) for ent in doc.ents]
                output = {"request": input_json, "response": {"named_entities": output}}
        output_json = json.dumps(output, ensure_ascii=False).encode('utf-8')
        sys.stdout.buffer.write(output_json)
        print()
