import React, { useRef } from 'react';
import { Modal, Form, message } from 'antd';
import { Editor } from '@tinymce/tinymce-react';

const RecordAppointmentModal = ({ visible, onCancel, onConfirm, appointment }) => {
    const [form] = Form.useForm();
    const clientEditorRef = useRef(null);
    const fileEditorRef = useRef(null);

    const handleOk = () => {
        form.validateFields().then(() => {
            const clientSummary = clientEditorRef.current?.getContent();
            const fileSummary = fileEditorRef.current?.getContent();

            if (!clientSummary || clientSummary.length < 30 || !fileSummary || fileSummary.length < 30) {
                message.error('Ambos resúmenes deben tener al menos 30 caracteres.');
                return;
            }

            onConfirm({ clientSummary, fileSummary });
            form.resetFields();
            if (appointment) {
                message.info(`Simulando apertura para imprimir resumen del cliente para: ${appointment.patient?.name} ${appointment.patient?.lastName}`);
                // Lógica real de impresión
            }
        }).catch((errorInfo) => {
            console.log('Validation Failed:', errorInfo);
        });
    };

    return (
        <Modal
            title="Registrar Cita Realizada"
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="clientSummary"
                    label="Resumen para el Cliente"
                    rules={[{ required: true, message: 'Por favor, ingresa el resumen para el cliente.' }]}
                >
                    <Editor
                        onInit={(evt, editor) => clientEditorRef.current = editor}
                        init={{
                            menubar: false,
                            plugins: [
                                'advlist autolink lists link image charmap print preview anchor',
                                'searchreplace visualblocks code fullscreen',
                                'insertdatetime media table paste code help wordcount'
                            ],
                            toolbar: 'undo redo | formatselect | ' +
                                'bold italic backcolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | help'
                        }}
                    />
                </Form.Item>

                <Form.Item
                    name="fileSummary"
                    label="Resumen para Archivo"
                    rules={[{ required: true, message: 'Por favor, ingresa el resumen para el archivo.' }]}
                >
                    <Editor
                        onInit={(evt, editor) => fileEditorRef.current = editor}
                        init={{
                            menubar: false,
                            plugins: [
                                'advlist autolink lists link image charmap print preview anchor',
                                'searchreplace visualblocks code fullscreen',
                                'insertdatetime media table paste code help wordcount'
                            ],
                            toolbar: 'undo redo | formatselect | ' +
                                'bold italic backcolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'removeformat | help'
                        }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RecordAppointmentModal;