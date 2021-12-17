import express from 'express';

const app = express();

app.get("/", (req, res) => {

});

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address()}`);
});