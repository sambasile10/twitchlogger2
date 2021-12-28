import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Message } from '../App';

type LogProps = {
  messages: Message[]
};

class Log extends React.Component<LogProps, {}> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return (
            <div className='container-bg'>
              <Container fluid className='log-scroll'>
                {
                  this.props.messages.map(message => (
                    <Row lg={12}>
                      <Col>{ message.timestamp } { message.message }</Col>
                    </Row>
                  ))
                }
              </Container>
            </div>
        );
    }
}

export default Log;