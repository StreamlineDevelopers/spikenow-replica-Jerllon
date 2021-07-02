import { useState, useEffect, useRef } from "react";
import { Card, Form, Button, Modal, Spinner } from "react-bootstrap";
import { HiOutlineAtSymbol } from "react-icons/hi";
import { BiCode } from "react-icons/bi";
import { FaLessThan } from "react-icons/fa";
import { FaPaperPlane } from "react-icons/fa";

import { Logout } from "../../components/GoogleAuth";

const ChatBody = ({
  onSubmit,
  senderName,
  message,
  setMessage,
  isShowBody,
  setShowBody,
  bubble,
  isSending,
}) => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubble]);

  return (
    <>
      <div>
        <Card
          className="w-100 border-top-0 border-left-0 border-right-0 rounded-0"
          style={{ height: "50px" }}
        >
          <div className="d-flex justify-content-between align-items-center my-auto mx-3">
            <h6>
              {" "}
              {isShowBody ? (
                <FaLessThan
                  className="cursor-pointer mr-2"
                  onClick={() => setShowBody(false)}
                />
              ) : (
                ""
              )}{" "}
              {isShowBody ? senderName : "Welcome to SpikeNow"}
            </h6>
            <Logout />
          </div>
        </Card>
      </div>
      {!isShowBody ? (
        <div
          className="d-flex flex-grow-1 justify-content-center align-items-center"
          style={{
            height: "0px",
            overflowY: "scroll",
          }}
        >
          <HiOutlineAtSymbol
            className="display-1"
            style={{ color: "lightgrey" }}
          />
        </div>
      ) : (
        <>
          <div
            className="d-flex flex-column flex-grow-1 px-3"
            style={{
              height: "0px",
              overflowY: "auto",
              backgroundColor: "white",
            }}
          >
            {bubble}
            <div ref={messagesEndRef}></div>
          </div>
          <div>
            <div className="d-flex" style={{ height: "50px" }}>
              <Form.Control
                type="text"
                className="rounded-0 border-right-0 border-left-0 shadow-none h-100"
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></Form.Control>
              <Button
                variant="link"
                className="bg-white border-top border-bottom rounded-0 m-0"
                onClick={handleShow}
              >
                {" "}
                <BiCode />{" "}
              </Button>
              <Button
                variant="link"
                className="bg-white border-top border-bottom rounded-0 m-0"
                onClick={() => onSubmit(message)}
                disabled={isSending ? true : false}
              >
                {" "}
                {isSending ? (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                ) : (
                  <FaPaperPlane />
                )}{" "}
              </Button>
            </div>
          </div>
          <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>Reply</Modal.Title>
            </Modal.Header>
            <Modal.Body></Modal.Body>
            <Modal.Footer>
              <Button variant="link" className="bg-white">
                {" "}
                <FaPaperPlane />{" "}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </>
  );
};

export default ChatBody;
