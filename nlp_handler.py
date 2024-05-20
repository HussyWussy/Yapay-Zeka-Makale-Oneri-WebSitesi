from collections import Counter
import os
from pathlib import Path
import numpy as np
import pandas as pd
from transformers import AutoModel, AutoTokenizer
from sklearn.metrics.pairwise import cosine_similarity
import torch.nn
import torch
import nltk
from matplotlib import pyplot as plt
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import string
from nltk.stem import PorterStemmer
from nltk.stem import WordNetLemmatizer
import re
import fasttext
from scipy.spatial.distance import cosine
from nltk.tokenize import sent_tokenize
import string
import pickle



class nlp_handler():
    __static_scibert_model__ = None
    __static_fasttext_model__ = None
    __static_scibert_model_tokenizer__ = None
    __static_stemmer__ = None
    __static_lemmatizer__ = None
    __static_stop_words__ = None
    __inspec__data_set_path__ = 'res/dataset/Inspec/docsutf8'
    __inspec_keys__data_set_path__ = 'res/dataset/Inspec/keys'
    __inspec_data_set__ = []
    __inspec_data_set_keys__ = []
    __fasttext_model_path__ = 'res/wiki.en.bin'
    __static_inspec_scibert_vectors__ :list = []
    __static_inspec_fasttext_vectors__ :list = []
        
    def __init__(self) -> None:
        for file_name in os.listdir(self.__inspec__data_set_path__):
                if file_name.endswith('.txt'):
                    with open(os.path.join(self.__inspec__data_set_path__, file_name), 'r', encoding='utf-8') as file:
                        abstract = file.read()
                        self.__inspec_data_set__.append(abstract)
        
        for file_name in os.listdir(self.__inspec_keys__data_set_path__):
                if file_name.endswith('.key'):
                    with open(os.path.join(self.__inspec_keys__data_set_path__, file_name), 'r', encoding='utf-8') as file:
                        abstract = file.read()
                        keys = []
                        for item in abstract.split(sep=('\n')):
                            if(item!=''):
                                keys.append(item)
                        self.__inspec_data_set_keys__.append(keys)
        
        
        self.__static_stemmer__ = PorterStemmer()
        self.__static_lemmatizer__ = WordNetLemmatizer()
        self.__static_stop_words__ = set(stopwords.words('english'))
        
        #scibert kısmı
        model_name = "allenai/scibert_scivocab_uncased"
        self.__static_scibert_model_tokenizer__ = AutoTokenizer.from_pretrained(model_name)
        self.__static_scibert_model__ = AutoModel.from_pretrained(model_name,output_hidden_states = True)
        self.__static_scibert_model__.eval()
        
        if Path("vectorized_data_inspec_scibert.pkl").exists():
            with open('vectorized_data_inspec_scibert.pkl', 'rb') as f:
                self.__static_inspec_scibert_vectors__ = pickle.load(f)
        else:
            for doc in self.__inspec_data_set__:
                sentence_embedding = self.__get_scibert_doc_embedding__(self.__static_scibert_model__,doc,self.__static_scibert_model_tokenizer__,self.__static_stemmer__,self.__static_lemmatizer__,self.__static_stop_words__)
                self.__static_inspec_scibert_vectors__.append(sentence_embedding)
                    
            with open('vectorized_data_inspec_scibert.pkl', 'wb') as f:
                pickle.dump(self.__static_inspec_scibert_vectors__, f)
        
        #fasttext kısmı
        
        self.__static_fasttext_model__ = fasttext.load_model(self.__fasttext_model_path__)
        
        if Path("fasttext_vectors.pkl").exists():
            with open('fasttext_vectors.pkl', 'rb') as f:
                self.__static_inspec_fasttext_vectors__ = pickle.load(f)
        else:
            for doc in self.__inspec_data_set__:
                tokens = self.__pre_process_fasttext_sentence__(doc,self.__static_scibert_model_tokenizer__,self.__static_stemmer__,self.__static_lemmatizer__,self.__static_stop_words__)
                sentence_embedding = self.__get_fasttext_embedding__(self.__static_fasttext_model__,doc)
                self.__static_inspec_fasttext_vectors__.append(sentence_embedding)
                    
            with open('fasttext_vectors.pkl', 'wb') as f:
                pickle.dump(self.__static_inspec_fasttext_vectors__, f)
    
    
    def get_frequent_keys(self,how_many_keys_to_get):
        all_keys=[]
        for sublist  in self.__inspec_data_set_keys__:
            for item in sublist:
                    all_keys.append(item)
        keys_count = Counter(all_keys)
        top_keys = keys_count.most_common(how_many_keys_to_get)
        
        return top_keys
        
    
    def get_scibert_results(self,sentence = "",interests = [] , approved_history = [] , disapproved_history = []):
        vectors_to_average = []
        
        if(sentence!=""):
            tokenized_scentence = self.__pre_process_scibert_sentence__(sentence,self. __static_scibert_model_tokenizer__)
            sentence = self.__get_scibert_sentence_embedding__(self.__static_scibert_model__,tokenized_scentence,self.__static_scibert_model_tokenizer__) 
            sentence_vector = torch.tensor(sentence) 
            vectors_to_average.append(sentence_vector)      
        
        if(interests != []):
            temp_interest_vectors = []
            for interest in interests:
                tokenized_interest = self.__pre_process_scibert_sentence__(interest,self.__static_scibert_model_tokenizer__)
                vector = self.__get_scibert_sentence_embedding__(self.__static_scibert_model__,tokenized_interest,self.__static_scibert_model_tokenizer__)
                temp_interest_vectors.append(vector)
            interests_mean = torch.mean(torch.stack(temp_interest_vectors),dim=0)
            vectors_to_average.append(interests_mean)

        if(approved_history != []):
            approved_history_vectors = []
            for doc in approved_history:
                tokenized_history = self.__pre_process_scibert_sentence__(doc,self.__static_scibert_model_tokenizer__)
                history_vector = self.__get_scibert_sentence_embedding__(self.__static_scibert_model__,tokenized_history,self.__static_scibert_model_tokenizer__)
                approved_history_vectors.append(history_vector)
            history_mean = torch.mean(torch.stack(approved_history_vectors),dim=0)
            vectors_to_average.append(history_mean)
        
        if vectors_to_average == []:
            return []
        
        return self.__get_similar_from_list__(self.__static_inspec_scibert_vectors__,torch.mean(torch.stack(vectors_to_average),dim=0),disapproved_history,interests)
    
    
    
    ################################################################################################################################################################################################
    
    
    
    def get_fasttext_results(self,sentence = "",interests = [] , approved_history = [] , disapproved_history = []):
        vectors_to_average = []
        if(sentence!=""):
            tokenized_scentence = self.__pre_process_fasttext_sentence__(sentence,self.__static_stemmer__,self.__static_lemmatizer__,self.__static_stop_words__)
            sentence = self.__get_fasttext_embedding__(self.__static_fasttext_model__,tokenized_scentence) 
            sentence_vector = torch.tensor(sentence) 
            vectors_to_average.append(sentence_vector)      
        
        if(interests != []):
            temp_interest_vectors = []
            for interest in interests:
                tokenized_interest = self.__pre_process_fasttext_sentence__(interest,self.__static_stemmer__,self.__static_lemmatizer__,self.__static_stop_words__)
                vector = self.__get_fasttext_embedding__(self.__static_fasttext_model__,tokenized_interest)
                temp_interest_vectors.append(torch.tensor(vector))
            stacked_vectors = torch.stack(temp_interest_vectors)
            interests_mean = torch.mean(stacked_vectors,dim=0)
            vectors_to_average.append(interests_mean)

        if(approved_history != []):
            approved_history_vectors = []
            for doc in approved_history:
                tokenized_history = self.__pre_process_fasttext_sentence__(doc,self.__static_stemmer__,self.__static_lemmatizer__,self.__static_stop_words__)
                history_vector = self.__get_fasttext_embedding__(self.__static_fasttext_model__,tokenized_history)
                approved_history_vectors.append(torch.tensor(history_vector))
                
            stacked_history_vectors = torch.stack(approved_history_vectors)
            history_mean = torch.mean(stacked_history_vectors,dim=0)
            vectors_to_average.append(history_mean)
            pass
        
        if vectors_to_average == []:
            return []
        
        return self.__get_similar_from_list__(self.__static_inspec_fasttext_vectors__,torch.mean(torch.stack(vectors_to_average),dim=0),disapproved_history,interests)
    
    
    def __get_fasttext_embedding__(self,model,tokenized_text):
        abstract_vector = [model.get_word_vector(word) for word in tokenized_text if word in model.words]
        if abstract_vector:
            return sum(abstract_vector) / len(abstract_vector)
        else:
            return []
        
    
    def __pre_process_fasttext_sentence__(self,text,stemmer,lemmatizer,stop_words):
        if isinstance(text, list):
            text = " ".join(text)
        text = text.lower()
        text = re.sub(r'[^\w\s]','',text)
        token_list = word_tokenize(text)

        words = []
        for token in token_list:
            if token not in stop_words:
                words.append(token)

        words2 = []
        for token in words:
            words2.append(lemmatizer.lemmatize(stemmer.stem(token)))
        
        #token_list.append(" [SEP]")
        return words2
    
    def __pre_process_scibert_sentence__(self,text,tokenizer):
        if isinstance(text, list):
            text = " ".join(text)
        #text = text.lower()
        #text = re.sub(r'[^\w\s]','',text)
        token_list = tokenizer.tokenize(text)  

        # words = []
        # for token in token_list:
        #     if token not in stop_words:
        #         words.append(token)

        # words2 = []
        # for token in words:
        #     words2.append(lemmatizer.lemmatize(stemmer.stem(token)))
        

        token_list.append(" [SEP]")
        return token_list

    def __get_scibert_sentence_embedding__(self,scibert_model,tokenized_text,tokenizer):
        indexed_tokens = tokenizer.convert_tokens_to_ids(tokenized_text)
        segments_ids = [1] * len(tokenized_text)    
        tokens_tensor = torch.tensor([indexed_tokens])
        segments_tensors = torch.tensor([segments_ids])
        with torch.no_grad():
            outputs = scibert_model(tokens_tensor, segments_tensors)
            hidden_states = outputs[2]
        token_vecs = hidden_states[-2][0]
        sentence_embedding = torch.mean(token_vecs, dim=0)
        #print(sentence_embedding.sum())
        return sentence_embedding

    def __get_similar_from_list__(self,vectors_list,vector_to_search,disapproved_history = [],user_interests = []):
        similars_list = []
        
        if vector_to_search.ndim == 1:
            vector_to_search = np.expand_dims(vector_to_search, axis=0)
            
        for i,vector in enumerate(vectors_list):
            if vector.ndim == 1:
                vector = np.expand_dims(vector, axis=0)
            similarity = cosine_similarity(vector, vector_to_search)
            if disapproved_history.count(self.__inspec_data_set__[i]) <= 0 :
                similars_list.append((i,similarity))
            # print(similarity)
            
        similars_list.sort(key=lambda x: x[1], reverse=True)
        ids = [item[0] for item in similars_list[:5]]
        a = []
       # data = [{'data': self.__inspec_data_set__[id], 'key': self.__inspec_data_set_keys__[id]} for id in ids]
        data = [{'data': self.__inspec_data_set__[id], 
         'key': self.__inspec_data_set_keys__[id],
         'precision': any(key in user_interests for key in self.__inspec_data_set_keys__[id])} 
        for id in ids]

        return data
    
    def __get_scibert_doc_embedding__(self,scibert_model,text,tokenizer,stemmer,lemmatizer,stop_words):
        if isinstance(text, list):
            text = " ".join(text)
        pattern = r"-(\w{3})-"
        text  = re.sub(pattern, "", text)
        token_list = sent_tokenize(text)
        #başlığı tokenize için kullanıyoruz.
        sentence = []
        sentence.append("[CLS] ")
        for token in token_list:
            new_sentence = self.__pre_process_scibert_sentence__(token,tokenizer)
            if(len(sentence+new_sentence)>511):
                break
            else:
                sentence = sentence + new_sentence
        vector = self.__get_scibert_sentence_embedding__(scibert_model,sentence,tokenizer)
        #print(sum(vector))
        
        return vector