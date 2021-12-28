import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import './App.css';
import Header from './components/Header';
import Log from './components/Log';

export declare type Message = {
  timestamp: string,
  message: string
};

type AppState = {
    messages: Message[]
};

const dummyMessages: Message[] = [
    { timestamp: '2021-12-28T00:15:45.754Z', message: 'MODS blupes' },
    { timestamp: '2021-12-27T23:56:47.964Z', message: 'Bing bang boom EZ' },
    { timestamp: '2021-12-27T23:40:14.099Z', message: 'Pog' },
];

const dummyChannels: string[] = [
  'sodapoppin', 'nyanners'
];

const default_state: AppState = {
    messages: dummyMessages
};

class App extends React.Component<{}, AppState> {

    constructor(props: any) {
        super(props);

        this.state = default_state;
    }

    performSearch = (channel: string, username: string) => {
        fetch(`/chat/${channel}?username=${username}&limit=50&skip=0`)
          .then(res => res.json())
          .then((result) => {
              this.setState({ messages: result.messages });
          }, (error) => {
              this.setState({ messages: [{ timestamp: '', message: 'error' }] });
          });
    }

    render() {
        return (
          <div>
            <Container fluid>
              <Row id="header-row" className="search-row">
                <Header onSearchCallback={this.performSearch} />
              </Row>
            </Container>
            <Log messages={this.state.messages}/>
          </div>
        );
    }
}

export default App;
