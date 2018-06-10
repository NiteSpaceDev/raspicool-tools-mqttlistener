FROM node:arm7

WORKDIR /root/
ADD ./package.json ./package.json

RUN npm i
ADD ./index.js ./index.js

RUN mkdir ./.aws
RUN ln -s /run/secrets/aws ./.aws/credentials

CMD ["npm", "start"]
