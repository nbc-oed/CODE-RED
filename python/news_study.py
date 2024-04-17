import pandas as pd
import string
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, confusion_matrix
import joblib

file_url = 'code_red_study.csv'
data = pd.read_csv(file_url)

def remove_punc(x):
  new_string=[]
  for i in x:
    if i not in string.punctuation:
      new_string.append(i)

  new_string = ''.join(new_string)
  return new_string 

data['text'] = data['text'].apply(remove_punc)

stop_words_list=[]
sw_file = open('stop_words.txt', 'r', encoding = 'utf-8')
for line in sw_file.readlines():
  stop_words_list.append(line.rstrip())
  
def stop_word(x):
  new_string = []
  for i in x:
    if i not in stop_words_list:
      new_string.append(i)
  new_string = ''.join(new_string)
  return new_string

data['text'] = data['text'].apply(stop_word)


data['target'] = data['target'].map({'accident':1, 'etc':0})


x = data['text']
y = data['target']

cv = CountVectorizer()
cv.fit(x) 
cv.vocabulary_ 

x = cv.transform(x)
x_train,x_test,y_train,y_test = train_test_split(x, y, test_size=0.2, random_state=100) #학습셋, 시험셋 분할

model = MultinomialNB()
model.fit(x_train, y_train)
pred = model.predict(x_test)

# accuracy_score(y_test,pred) # 정확도 계산
print(accuracy_score(y_test,pred))
print(confusion_matrix(y_test,pred))

joblib.dump((model, cv), 'model.pkl')