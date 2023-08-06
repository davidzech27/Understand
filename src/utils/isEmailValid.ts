export default function isEmailValid(email: string) {
	return (
		email.search(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/g) !== -1
	)
}
