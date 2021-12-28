import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import './App.css';
import Header from './components/Header';
import Log from './components/Log';

export declare type Message = {
  timestamp: string,
  message: string
};

const dummyMessages: Message[] = [
    { timestamp: '2021-12-28T00:15:45.754Z', message: 'MODS blupes' },
    { timestamp: '2021-12-27T23:56:47.964Z', message: 'Bing bang boom EZ' },
    { timestamp: '2021-12-27T23:40:14.099Z', message: 'Pog' },
];

class App extends React.Component<{}, {}> {

    constructor(props: any) {
        super(props);
    }

    render() {
        return (
          <div>
            <Container fluid>
              <Row id="header-row" className="search-row">
                <Header channels={['sodapoppin','nyanners']} />
              </Row>
            </Container>
            <Log messages={dummyMessages}/>
          </div>
        );
    }
}

export default App;
