import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import './App.css';
import Header from './components/Header';

class App extends React.Component<{}, {}> {

    constructor(props: any) {
        super(props);
    }

    render() {
        return (
          <Container fluid>
            <Row className="search-row">
              <Header channels={['sodapoppin','nyanners']} />
            </Row>
          </Container>
        );
    }
}

export default App;
