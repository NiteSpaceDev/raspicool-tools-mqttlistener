FROM node:arm7

WORKDIR /root/
RUN mkdir ./.aws
RUN ln -s /run/secrets/aws ./.aws/credentials

ADD ./package.json ./package.json
RUN npm i
ADD ./index.js ./index.js


CMD ["npm", "start"]
